import type { CmsPostContent } from '@roottale/cms-client/server';

import { DOCTOR_PROFILE_HREF, isRepresentativeDoctor } from '../clinic/doctor-profile-link';
import { cfImageSrcSet, cfImageVariantUrl } from '../cms/cf-image-url';

import {
  formatReviewDate,
  reviewEntryPath,
  reviewExcerpt,
  reviewImageUrl,
  reviewMetadata,
  reviewTitle,
} from './review-model';

/** 대표 이미지가 없는 후기는 블로그 목록과 같은 병원 로고를 기본 도판으로 쓴다. */
const BRAND_LOGO_SRC = '/madi/img/hi_gwangju2020_20240826.png';

type ReviewCardProps = {
  post: CmsPostContent;
};

export default function ReviewCard({ post }: ReviewCardProps) {
  const metadata = reviewMetadata(post);
  const href = reviewEntryPath(post);
  const date = formatReviewDate(post.publishedAt);
  const imageUrl = reviewImageUrl(post);
  const imageSrcSet = imageUrl ? cfImageSrcSet(imageUrl) : undefined;
  const imageSrc = imageUrl ? cfImageVariantUrl(imageUrl, 'md') : null;
  const title = reviewTitle(post);
  const excerpt = reviewExcerpt(post);

  return (
    <article className="review-card">
      {/* 카드 전체를 감싸는 대신 제목 링크를 카드 위로 펼쳐, 담당 원장 링크를 따로 누를 수 있게 둔다. */}
      <div className="review-card__link">
        <figure className="review-card__media">
          {imageSrc ? (
            <img
              src={imageSrc}
              srcSet={imageSrcSet}
              sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
              alt={`${title} 후기 원문`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img
              className="review-card__placeholder review-card__brand-logo"
              src={BRAND_LOGO_SRC}
              alt=""
              width="240"
              height="60"
              loading="lazy"
              decoding="async"
            />
          )}
        </figure>
        <div className="review-card__body">
          <div className="review-card__topline">
            {metadata.category && <span>{metadata.category}</span>}
            {date && <time dateTime={post.publishedAt}>{date}</time>}
          </div>
          <h3>
            <a className="review-card__title-link" href={href}>
              {title}
            </a>
          </h3>
          {excerpt && <p className="review-card__excerpt">{excerpt}</p>}
          {(metadata.patient || metadata.doctor) && (
            <dl className="review-card__facts">
              {metadata.patient && <div><dt>환자</dt><dd>{metadata.patient}</dd></div>}
              {metadata.doctor && (
                <div>
                  <dt>담당</dt>
                  <dd>
                    {isRepresentativeDoctor(metadata.doctor) ? (
                      <a className="review-card__doctor" href={DOCTOR_PROFILE_HREF}>
                        {metadata.doctor}
                      </a>
                    ) : (
                      metadata.doctor
                    )}
                  </dd>
                </div>
              )}
            </dl>
          )}
          <span className="review-card__more">
            자세히 보기 <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </article>
  );
}
