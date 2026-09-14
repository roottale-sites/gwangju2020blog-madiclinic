import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../../styles/site/column.css';
import '../../../../styles/site/post-pattern.css';
import ColumnPreviewRoute, { columnPreviewMetadata } from '../../../../features/column/ColumnPreviewRoute';

/**
 * ROOT-ADMIN 편집기의 '미리보기'·'공유 링크'가 여는 주소 (ADR-0104).
 * 편집 중인 칼럼을 발행 화면(`ColumnDetailView`)과 같은 화면으로 그린다.
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

export async function generateMetadata({ searchParams }: PreviewPageProps): Promise<Metadata> {
  return columnPreviewMetadata(readToken((await searchParams).token));
}

export default async function PostPreviewPage({ params, searchParams }: PreviewPageProps) {
  const { id } = await params;
  const token = readToken((await searchParams).token);
  if (!token) notFound();
  return <ColumnPreviewRoute postId={id} token={token} />;
}
