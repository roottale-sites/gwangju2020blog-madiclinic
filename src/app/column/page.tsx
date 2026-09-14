import type { Metadata } from 'next';

import '../../styles/site/column.css';
import '../../styles/site/post-pattern.css';
import ColumnArchive, { columnIndexMetadataFor } from '../../features/column/ColumnArchive';
import { parseColumnPageNumber } from '../../features/column/column-pagination';

/**
 * 데이터는 24시간 `unstable_cache`가 잡고, 렌더링은 요청 시점에 한다.
 * 정적 프리렌더를 하면 빌드 순간의 CMS 상태가 그대로 굳어버려 런타임의
 * 비밀값·장애 상태가 반영되지 않는다.
 */
export const dynamic = 'force-dynamic';

type ColumnIndexPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0]?.trim() ?? '' : value?.trim() ?? '';
}

function listState(params: Record<string, string | string[] | undefined>) {
  return {
    requestedPage: parseColumnPageNumber(firstValue(params.page) || null),
    searchQuery: firstValue(params.q),
  };
}

export async function generateMetadata({ searchParams }: ColumnIndexPageProps): Promise<Metadata> {
  return columnIndexMetadataFor(listState(await searchParams));
}

export default async function ColumnIndexPage({ searchParams }: ColumnIndexPageProps) {
  const state = listState(await searchParams);
  return <ColumnArchive requestedPage={state.requestedPage} searchQuery={state.searchQuery} />;
}
