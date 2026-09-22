import Link from 'next/link';
import { DOCTOR_PROFILE_HREF, POST_AUTHOR_NAME } from '../clinic/doctor-profile-link';
import { formatColumnDate } from './column-content';
import { columnEntryPath, type ColumnArchiveEntry } from './column-model';

type ColumnArchiveRowProps = {
  entry: ColumnArchiveEntry;
};

/** 대표 이미지가 없는 글의 대체 도판. 본 사이트 헤더 로고(240×60)다. */
const BRAND_LOGO_SRC = '/madi/img/hi_gwangju2020_20240826.png';

function ColumnArchiveThumbnail({ entry }: ColumnArchiveRowProps) {
  if (!entry.featuredImageUrl) {
    return (
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        className="column-card__brand-logo"
        width="240"
        height="60"
      />
    );
  }

  return (
    <img
      src={entry.featuredImageUrl}
      alt=""
      className="column-card__image"
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * 목록 한 행(도판·제목·요약·지은이·날짜).
 *
 * 행 전체를 링크로 감싸는 대신 제목 링크를 행 위로 펼쳐, 지은이 링크를 따로
 * 누를 수 있게 둔다. headnerve와 같은 구조이며 이관 글의 표시 메타데이터
 * 보정(`legacy-column-list-excerpts`)만 빠졌다.
 */
export default function ColumnArchiveRow({ entry }: ColumnArchiveRowProps) {
  return (
    <li className="column-card">
      <div className="column-card__link">
        <span className="column-card__thumbnail">
          <ColumnArchiveThumbnail entry={entry} />
        </span>
        <div className="column-card__content">
          <h3>
            <Link className="column-card__title-link" href={columnEntryPath(entry)}>
              {entry.title}
            </Link>
          </h3>
          <span className="column-card__excerpt">{entry.description}</span>
          <span className="column-card__meta">
            <Link className="column-card__category" href={entry.category.path}>
              {entry.category.name}
            </Link>
          </span>
        </div>
        <div className="column-card__byline">
          <time className="column-card__date" dateTime={entry.publishedAt}>
            {formatColumnDate(entry.publishedAt)}
          </time>
          <a className="column-card__author" href={DOCTOR_PROFILE_HREF}>{POST_AUTHOR_NAME}</a>
        </div>
      </div>
    </li>
  );
}
