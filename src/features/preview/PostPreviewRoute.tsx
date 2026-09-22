import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ColumnDetailView } from '../column/ColumnDetailRoute';
import { columnEntryFromPost } from '../column/column-model';
import ReviewDetailView from '../reviews/ReviewDetailView';
import FaqPreview from './FaqPreview';
import { loadPostPreview } from './post-preview';
import { PreviewMessage, PreviewNotice } from './PreviewNotice';

export async function postPreviewMetadata(postId: string, token: string): Promise<Metadata> {
  const lookup = await loadPostPreview(postId, token);
  return {
    title: { absolute: lookup.kind === 'post' ? `${lookup.post.title} (미리보기)` : '미리보기' },
    robots: { index: false, follow: false },
  };
}

export default async function PostPreviewRoute({ postId, token }: Readonly<{ postId: string; token: string }>) {
  const lookup = await loadPostPreview(postId, token);
  if (lookup.kind === 'missing') notFound();
  if (lookup.kind === 'expired') return <PreviewMessage title="미리보기 링크가 만료됐어요">
    미리보기 링크는 1시간 동안만 유효합니다. 관리자에서 미리보기를 다시 열어 주세요.
  </PreviewMessage>;
  if (lookup.kind === 'unavailable') return <PreviewMessage title="미리보기를 불러오지 못했습니다">
    잠시 뒤 관리자에서 미리보기를 다시 열어 주세요.
  </PreviewMessage>;
  if (lookup.kind === 'unsupported') return <PreviewMessage title="이 콘텐츠 유형은 연결되지 않았습니다">
    이 사이트는 칼럼·FAQ·치료후기 유형을 지원합니다. 관리자에서 콘텐츠 유형을 확인해 주세요.
  </PreviewMessage>;
  if (lookup.kind !== 'post') notFound();
  const post = lookup.post;
  const notice = <PreviewNotice expiresAt={post.preview.expiresAt} />;
  if (post.collectionKey === 'reviews') return <ReviewDetailView post={post} notice={notice} />;
  if (post.collectionKey === 'faq') return FaqPreview({ post });
  const entry = columnEntryFromPost({ ...post, bodyHtml: post.bodyHtml ?? null,
    publishedAt: post.publishedAt || post.updatedAt,
  });
  if (!entry) return <PreviewMessage title="분류를 선택해 주세요">
    칼럼 분류를 하나 선택하면 실제 사이트와 같은 화면으로 미리보기를 볼 수 있습니다.
  </PreviewMessage>;
  return <ColumnDetailView entry={entry} notice={notice} />;
}
