import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import ArticleNavigation, { type ArticleNavigationLink } from '../../components/site/ArticleNavigation';
import ArticleHeaderFooter from '../../components/site/ArticleHeaderFooter';
import JsonLd from '../../components/site/JsonLd';
import { siteUrl } from '../../data/site';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import { DOCTOR_PROFILE_HREF, POST_AUTHOR_NAME } from '../clinic/doctor-profile-link';
import { articleJsonLd, webPageJsonLd } from '../seo/schema';
import { DEFAULT_OG_IMAGE_URL } from '../seo/og-image';
import ColumnTableOfContents from './ColumnTableOfContents';
import ColumnConsultationPhoto from './ColumnConsultationPhoto';
import { columnBreadcrumb } from './ColumnArchive';
import {
  columnIndexMetadata,
  columnMedicalDisclaimer,
  formatColumnDate,
} from './column-content';
import { buildColumnDocument } from './column-document';
import { columnEntryPath, columnEntrySeoTitle, type ColumnEntry } from './column-model';
import { resolveColumnArchive, resolveColumnEntry } from './column-source';

export async function columnDetailMetadata(slug: string): Promise<Metadata> {
  const entry = await resolveColumnEntry(slug);
  if (!entry) {
    return {
      title: { absolute: `글을 찾을 수 없습니다 | ${columnIndexMetadata.title}` },
      description: '요청한 글을 찾을 수 없습니다.',
      robots: { index: false, follow: true },
    };
  }
  const canonical = columnEntryPath(entry);
  const title = columnEntrySeoTitle(entry);
  const imageUrl = entry.shareImageUrl ?? DEFAULT_OG_IMAGE_URL;
  return {
    title: { absolute: title },
    description: entry.description,
    alternates: { canonical },
    // ROOT-ADMIN 공개 화면 반영 확인이 읽는 글 수정 시각 표식.
    other: {
      'rt:content-id': entry.contentId,
      ...(entry.updatedAt ? { 'roottale:revision': entry.updatedAt } : {}),
    },
    openGraph: {
      type: 'article',
      title,
      description: entry.description,
      url: siteUrl(canonical),
      publishedTime: entry.publishedAt,
      ...(entry.updatedAt ? { modifiedTime: entry.updatedAt } : {}),
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: entry.description,
      images: [imageUrl],
    },
  };
}

export default async function ColumnDetailRoute({
  slug,
  expectedCategorySlug,
}: Readonly<{ slug: string; expectedCategorySlug?: string }>) {
  const entry = await resolveColumnEntry(slug);
  if (!entry || (expectedCategorySlug && entry.category.slug !== expectedCategorySlug)) notFound();
  const archive = await resolveColumnArchive();
  const entries = archive.entries.filter((item) => item.category.slug === entry.category.slug);
  const currentIndex = entries.findIndex((item) => item.slug === entry.slug);
  const previous = currentIndex > 0 ? entries[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 ? entries[currentIndex + 1] : undefined;
  return <ColumnDetailView entry={entry}
    previous={previous ? { href: columnEntryPath(previous), title: previous.title } : undefined}
    next={next ? { href: columnEntryPath(next), title: next.title } : undefined} />;
}

/**
 * 칼럼 상세 화면 본체. 발행 글(`ColumnDetailRoute`)과 ROOT-ADMIN 미리보기
 * (`/preview/post/[id]`, ADR-0104)가 **같은 화면**을 쓰게 분리했다 — 그래서
 * 미리보기가 발행 결과와 같다. `notice`는 미리보기 안내 띠처럼 화면 위에 덧붙일 요소.
 *
 * headnerve와 달리 하단은 `ClinicGuide`(진료 안내 박스, DESIGN.md §5의
 * `.commonBox`)와 의료 콘텐츠 안내, 진료 사진을 둔다. 질환 페이지와
 * 그 링크 규칙(`DISEASE_LINK_RULES`)은 이 사이트에 없다.
 */
export function ColumnDetailView({
  entry,
  notice,
  previous,
  next,
}: Readonly<{
  entry: ColumnEntry;
  notice?: ReactNode;
  previous?: ArticleNavigationLink;
  next?: ArticleNavigationLink;
}>) {
  const canonical = columnEntryPath(entry);
  const isImportedHtml = entry.bodyFormat === 'imported-html';
  const columnDocument = buildColumnDocument(
    entry.bodyHtml,
    isImportedHtml ? 'source-preserved' : 'annotated',
  );
  const crumbs = [
    ...columnBreadcrumb,
    { name: entry.category.name, href: entry.category.path },
    { name: entry.title, href: canonical },
  ];

  return (
    <MadiPageFrame
      pathname={canonical}
      title={columnIndexMetadata.label}
      banner="01"
      crumbs={crumbs}
    >
      <JsonLd
        nodes={[
          webPageJsonLd({ path: canonical, name: entry.title, description: entry.description }),
          articleJsonLd({
            path: canonical,
            headline: entry.title,
            description: entry.description,
            publishedAt: entry.publishedAt,
            ...(entry.shareImageUrl ? { image: entry.shareImageUrl } : {}),
          }),
        ]}
      />
      <div className="cBox column-detail-page clearFix">
        {notice}
        <article className="column-detail" data-track-read={entry.contentId}>
          <div className="column-shell">
            <div className="column-detail__surface">
              <header className="column-detail__header article-header-card">
                <h2>{entry.title}</h2>
                <ArticleHeaderFooter>
                  <a href={DOCTOR_PROFILE_HREF}>{POST_AUTHOR_NAME}</a>
                  <time dateTime={entry.publishedAt}>{formatColumnDate(entry.publishedAt)}</time>
                </ArticleHeaderFooter>
              </header>
            </div>
            <div className="column-detail__layout">
              <ColumnTableOfContents items={columnDocument.tableOfContents} />
              <div className="column-detail__reading">
                <div
                  className={isImportedHtml ? 'column-imported-html' : 'column-richtext'}
                  dangerouslySetInnerHTML={{ __html: columnDocument.bodyHtml }}
                />
                <ClinicGuide />
                <aside className="column-disclaimer" aria-label="의료 콘텐츠 안내">
                  <strong>의료 콘텐츠 안내</strong>
                  <p>{columnMedicalDisclaimer}</p>
                </aside>
                <ColumnConsultationPhoto />
                <ArticleNavigation previous={previous} next={next}
                  listHref={entry.category.path} listLabel="블로그 목록" />
              </div>
              <div className="column-detail__balance" aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>
    </MadiPageFrame>
  );
}
