import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import { columnBreadcrumb } from './ColumnArchive';
import { ColumnDetailView } from './ColumnDetailRoute';
import { loadColumnPostPreview } from './column-api';
import { columnIndexMetadata } from './column-content';
import { columnEntryFromPost } from './column-model';
import { ColumnPreviewExpiredError, type ColumnPreviewPost } from './column-wire';

type PreviewLookup =
  | { kind: 'post'; post: ColumnPreviewPost }
  | { kind: 'missing' }
  | { kind: 'expired' };

// 같은 요청 안에서 metadata와 본문이 토큰 조회를 한 번만 하도록 묶는다.
const lookupPreview = cache(async (token: string): Promise<PreviewLookup> => {
  try {
    const post = await loadColumnPostPreview(token);
    return post ? { kind: 'post', post } : { kind: 'missing' };
  } catch (error) {
    if (error instanceof ColumnPreviewExpiredError) return { kind: 'expired' };
    throw error;
  }
});

/** 미리보기는 항상 noindex/nofollow — 초안이 색인되거나 발행 주소와 중복되면 안 된다. */
export async function columnPreviewMetadata(token: string): Promise<Metadata> {
  const lookup = token ? await lookupPreview(token) : ({ kind: 'missing' } as const);
  const title = lookup.kind === 'post' ? `${lookup.post.title} (미리보기)` : '미리보기';
  return { title: { absolute: title }, robots: { index: false, follow: false } };
}

function formatExpiry(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

function PreviewNotice({ expiresAt }: Readonly<{ expiresAt: string }>) {
  const expiry = formatExpiry(expiresAt);
  return (
    <div className="column-shell">
      <p className="column-preview-notice" role="status">
        <strong>미리보기</strong> — 아직 공개되지 않은 내용이며 검색에 노출되지 않습니다.
        {expiry ? ` ${expiry}까지 볼 수 있어요.` : ''}
      </p>
    </div>
  );
}

function PreviewMessage({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <MadiPageFrame
      pathname="/column"
      title={columnIndexMetadata.label}
      banner="01"
      crumbs={columnBreadcrumb}
    >
      <div className="cBox column-detail-page clearFix">
        <div className="column-shell">
          <section className="column-preview-message" aria-live="polite">
            <h1>{title}</h1>
            <p>{body}</p>
          </section>
        </div>
      </div>
    </MadiPageFrame>
  );
}

/**
 * ROOT-ADMIN 미리보기 (ADR-0104). 편집기가 발급한 토큰(1시간·글 1건 전용)으로
 * 편집 중인 칼럼을 받아 발행 화면과 **같은** `ColumnDetailView`로 그린다.
 * 없는 토큰·다른 글의 토큰은 404, 만료는 안내 문구.
 *
 * 분류가 정확히 하나 붙지 않은 초안은 공개 주소를 만들 수 없어 404다
 * (`columnEntryFromPost`가 null). ROOT-ADMIN에서 분류를 고르면 바로 보인다.
 */
export default async function ColumnPreviewRoute({
  postId,
  token,
}: Readonly<{ postId: string; token: string }>) {
  const lookup = await lookupPreview(token);
  if (lookup.kind === 'expired') {
    return (
      <PreviewMessage
        title="미리보기 링크가 만료됐어요"
        body="미리보기 링크는 1시간 동안만 유효합니다. 관리자 편집기에서 미리보기를 다시 열어 주세요."
      />
    );
  }
  if (lookup.kind === 'missing' || lookup.post.id !== postId) notFound();

  const entry = columnEntryFromPost(lookup.post);
  if (!entry) notFound();
  return (
    <ColumnDetailView
      entry={entry}
      notice={<PreviewNotice expiresAt={lookup.post.preview.expiresAt} />}
    />
  );
}
