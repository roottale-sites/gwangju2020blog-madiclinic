import type { Metadata } from 'next';

import '../../../../styles/site/column.css';
import '../../../../styles/site/post-pattern.css';
import ColumnDetailRoute, {
  columnDetailMetadata,
} from '../../../../features/column/ColumnDetailRoute';

type NestedColumnPageProps = { params: Promise<{ category: string; slug: string }> };

export const dynamic = 'force-dynamic';

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: NestedColumnPageProps): Promise<Metadata> {
  return columnDetailMetadata(decodeSegment((await params).slug));
}

export default async function NestedColumnPage({ params }: NestedColumnPageProps) {
  const { category, slug } = await params;
  return (
    <ColumnDetailRoute
      slug={decodeSegment(slug)}
      expectedCategorySlug={decodeSegment(category)}
    />
  );
}
