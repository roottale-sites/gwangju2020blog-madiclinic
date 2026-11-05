import type { SiteContent } from '../../features/site-content/bindings';
import ContentCafeLink from './ContentCafeLink';
import PreferredSourceLink from './PreferredSourceLink';

export default function ArticleHeaderActions({ content }: { content?: SiteContent } = {}) {
  return (
    <div className="article-header-actions">
      <ContentCafeLink content={content} />
      <PreferredSourceLink content={content} />
    </div>
  );
}
