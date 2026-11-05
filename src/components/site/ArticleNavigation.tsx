import { bindGroup, contentAttributes as edit, present, type SiteContent } from '../../features/site-content/bindings';
import { commonDefaults } from '../../features/site-content/defaults';
import Link from 'next/link';

export type ArticleNavigationLink = Readonly<{ href: string; title: string }>;

export default function ArticleNavigation({ previous, next, listHref, listLabel, content }: Readonly<{
  content?: SiteContent;
  previous?: ArticleNavigationLink;
  next?: ArticleNavigationLink;
  listHref: string;
  listLabel: string;
}>) {
  const { pageCommon } = bindGroup(content, 'clinic-common', 'shared', commonDefaults);
  const listKey = listLabel === '블로그 목록' ? 'columnList' : 'reviewsList';
  return (
    <nav className="article-navigation" aria-label="이전글 다음글">
      {previous && present(pageCommon.previous) ? (
        <Link className="article-navigation__previous" href={previous.href} rel="prev">
          <span className="article-navigation__label" {...edit(pageCommon, 'previous')}>{pageCommon.previous}</span>
          <span className="article-navigation__title">{previous.title}</span>
        </Link>
      ) : <span aria-hidden="true" />}
      {present(pageCommon[listKey]) && <Link className="article-navigation__list" href={listHref} {...edit(pageCommon, listKey)}>{pageCommon[listKey]}</Link>}
      {next && present(pageCommon.next) ? (
        <Link className="article-navigation__next" href={next.href} rel="next">
          <span className="article-navigation__label" {...edit(pageCommon, 'next')}>{pageCommon.next}</span>
          <span className="article-navigation__title">{next.title}</span>
        </Link>
      ) : <span aria-hidden="true" />}
    </nav>
  );
}
