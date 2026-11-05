import type { SiteContent } from '../../features/site-content/bindings';
import type { ReactNode } from 'react';
import ArticleHeaderActions from './ArticleHeaderActions';

/** 세 글 유형의 작성 정보와 출처·카페 동작을 같은 위치에 배치한다. */
export default function ArticleHeaderFooter({ children, content }: { children: ReactNode; content?: SiteContent }) {
  return (
    <div className="article-header-foot">
      <div className="article-header-byline">{children}</div>
      <ArticleHeaderActions content={content} />
    </div>
  );
}
