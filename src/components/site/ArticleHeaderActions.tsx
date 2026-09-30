import ContentCafeLink from './ContentCafeLink';
import PreferredSourceLink from './PreferredSourceLink';

export default function ArticleHeaderActions() {
  return (
    <div className="article-header-actions">
      <ContentCafeLink />
      <PreferredSourceLink />
    </div>
  );
}
