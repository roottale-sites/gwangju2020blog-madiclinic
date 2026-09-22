import Link from 'next/link';

export type ArticleNavigationLink = Readonly<{ href: string; title: string }>;

export default function ArticleNavigation({ previous, next, listHref, listLabel }: Readonly<{
  previous?: ArticleNavigationLink;
  next?: ArticleNavigationLink;
  listHref: string;
  listLabel: string;
}>) {
  return (
    <nav className="article-navigation" aria-label="이전글 다음글">
      {previous ? (
        <Link className="article-navigation__previous" href={previous.href} rel="prev">
          <span className="article-navigation__label">이전글</span>
          <span className="article-navigation__title">{previous.title}</span>
        </Link>
      ) : <span aria-hidden="true" />}
      <Link className="article-navigation__list" href={listHref}>{listLabel}</Link>
      {next ? (
        <Link className="article-navigation__next" href={next.href} rel="next">
          <span className="article-navigation__label">다음글</span>
          <span className="article-navigation__title">{next.title}</span>
        </Link>
      ) : <span aria-hidden="true" />}
    </nav>
  );
}
