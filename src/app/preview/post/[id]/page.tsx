import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../../styles/site/column.css';
import '../../../../styles/site/post-pattern.css';
import '../../../../styles/site/reviews.css';
import '../../../../styles/site/review-detail.css';
import '../../../../styles/site/review-faq.css';
import '../../../../styles/site/faq.css';
import '../../../../styles/site/faq-detail.css';
import PostPreviewRoute, { postPreviewMetadata } from '../../../../features/preview/PostPreviewRoute';

/**
 * ROOT-ADMIN 편집기의 '미리보기'·'공유 링크'가 여는 주소 (ADR-0104).
 * 편집 중인 칼럼·후기·FAQ를 각 발행 화면과 같은 화면으로 그린다.
 * 항상 동적 렌더 + noindex. 토큰 없이는 404.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PreviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function readToken(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export async function generateMetadata({ params, searchParams }: PreviewPageProps): Promise<Metadata> {
  return postPreviewMetadata((await params).id, readToken((await searchParams).token));
}

export default async function PostPreviewPage({ params, searchParams }: PreviewPageProps) {
  const { id } = await params;
  const token = readToken((await searchParams).token);
  if (!token) notFound();
  return <PostPreviewRoute postId={id} token={token} />;
}
