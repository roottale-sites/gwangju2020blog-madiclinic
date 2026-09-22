import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import { clinic } from '../../data/clinic';
import { siteUrl } from '../../data/site';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import { DOCTOR_PROFILE_HREF } from '../clinic/doctor-profile-link';
import { articleJsonLd, webPageJsonLd } from '../seo/schema';
import ColumnTableOfContents from './ColumnTableOfContents';
import { columnBreadcrumb } from './ColumnArchive';
import {
  columnIndexMetadata,
  columnMedicalDisclaimer,
  formatColumnDate,
} from './column-content';
import { buildColumnDocument } from './column-document';
import { columnEntryPath, columnEntrySeoTitle, type ColumnEntry } from './column-model';
import { resolveColumnEntry } from './column-source';

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
  return {
    title: { absolute: title },
    description: entry.description,
    alternates: { canonical },
    other: { 'rt:content-id': entry.contentId },
    openGraph: {
      type: 'article',
      title,
      description: entry.description,
      url: siteUrl(canonical),
      publishedTime: entry.publishedAt,
      ...(entry.updatedAt ? { modifiedTime: entry.updatedAt } : {}),
      // 글별 이미지가 없으면 app/opengraph-image.png(사이트 기본)를 그대로 상속한다.
      ...(entry.shareImageUrl ? { images: [entry.shareImageUrl] } : {}),
    },
    ...(entry.shareImageUrl
      ? {
          twitter: {
            card: 'summary_large_image',
            title,
            description: entry.description,
            images: [entry.shareImageUrl],
          },
        }
      : {}),
  };
}

export default async function ColumnDetailRoute({
  slug,
  expectedCategorySlug,
}: Readonly<{ slug: string; expectedCategorySlug?: string }>) {
  const entry = await resolveColumnEntry(slug);
  if (!entry || (expectedCategorySlug && entry.category.slug !== expectedCategorySlug)) notFound();
  return <ColumnDetailView entry={entry} />;
}

/**
 * 칼럼 상세 화면 본체. 발행 글(`ColumnDetailRoute`)과 ROOT-ADMIN 미리보기
 * (`/preview/post/[id]`, ADR-0104)가 **같은 화면**을 쓰게 분리했다 — 그래서
 * 미리보기가 발행 결과와 같다. `notice`는 미리보기 안내 띠처럼 화면 위에 덧붙일 요소.
 *
 * headnerve와 달리 하단은 `ClinicGuide`(진료 안내 박스, DESIGN.md §5의
 * `.commonBox`) + 의료 면책 문구 두 개만 둔다. 질환 페이지 링크(`DISEASE_LINK_RULES`)와
 * 카페 링크는 이 사이트에 없다.
 */
export function ColumnDetailView({
  entry,
  notice,
}: Readonly<{ entry: ColumnEntry; notice?: ReactNode }>) {
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
            source: entry.copiedFrom,
            ...(entry.shareImageUrl ? { image: entry.shareImageUrl } : {}),
          }),
        ]}
      />
      <div className="cBox column-detail-page clearFix">
        {notice}
        <article className="column-detail" data-track-read={entry.contentId}>
          <div className="column-shell">
            <div className="column-detail__surface">
              <header className="column-detail__header">
                <h2>{entry.title}</h2>
                <div className="column-detail__header-foot">
                  <p className="column-detail__byline">
                    <span>
                      {entry.copiedFrom ? (
                        <>원문: <a href={entry.copiedFrom.url}>{entry.copiedFrom.name}</a></>
                      ) : (
                        <>{clinic.name}{' '}<a href={DOCTOR_PROFILE_HREF}>{clinic.representative} 원장</a></>
                      )}
                    </span>
                    <time dateTime={entry.publishedAt}>{formatColumnDate(entry.publishedAt)}</time>
                  </p>
                </div>
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
                <footer className="column-detail__footer">
                  <Link href={entry.category.path}>
                    <span aria-hidden="true">←</span> {entry.category.name} 글 목록
                  </Link>
                </footer>
              </div>
              <div className="column-detail__balance" aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>
    </MadiPageFrame>
  );
}
