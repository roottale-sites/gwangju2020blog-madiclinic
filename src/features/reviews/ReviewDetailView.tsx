import Link from 'next/link';
import type { ReactNode } from 'react';
import type { CmsPostContent } from '@roottale/cms-client/server';
import ArticleNavigation from '../../components/site/ArticleNavigation';
import PreferredSourceLink from '../../components/site/PreferredSourceLink';
import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import { DOCTOR_PROFILE_HREF, isRepresentativeDoctor } from '../clinic/doctor-profile-link';
import { cfImageSrcSet, cfImageVariantUrl } from '../cms/cf-image-url';
import { faqPageJsonLd, webPageJsonLd } from '../seo/schema';
import ReviewCard from './ReviewCard';
import ReviewFaq from './ReviewFaq';
import { renderReviewBodySections } from './review-body';
import { reviewDisclosure, reviewsIndexMetadata } from './review-content';
import { reviewFaqItems } from './review-faq';
import {
  formatReviewDate, relatedReviews, reviewEntryPath, reviewExcerpt, reviewImageUrl,
  reviewLeadImageUrl, reviewMetadata, reviewSeoDescription, reviewTitle,
} from './review-model';
import { reviewsBreadcrumb } from '../../app/reviews/page';

function isSameReviewImage(left: string, right: string): boolean {
  return cfImageVariantUrl(left, 'lg') === cfImageVariantUrl(right, 'lg');
}

/** 발행 글과 관리자 미리보기가 같은 후기 화면을 사용한다. */
export default function ReviewDetailView({ post, archivePosts = [], notice }: Readonly<{
  post: CmsPostContent;
  archivePosts?: readonly CmsPostContent[];
  notice?: ReactNode;
}>) {
  const metadata = reviewMetadata(post);
  const title = reviewTitle(post);
  const excerpt = reviewExcerpt(post);
  const leadImageUrl = reviewLeadImageUrl(post);
  const originalImageUrl = post.featuredImageUrl ?? leadImageUrl;
  const originalImageIsLeadingBodyImage = Boolean(
    originalImageUrl && leadImageUrl && isSameReviewImage(originalImageUrl, leadImageUrl),
  );
  const bodySections = renderReviewBodySections(post.bodyJson, {
    omitLeadingImage: originalImageIsLeadingBodyImage,
  });
  const faqItems = reviewFaqItems(post);
  const currentIndex = archivePosts.findIndex((candidate) => candidate.id === post.id);
  const newerRecord = currentIndex > 0 ? archivePosts[currentIndex - 1] : null;
  const olderRecord = currentIndex >= 0 ? archivePosts[currentIndex + 1] ?? null : null;
  const relatedRecord = olderRecord ?? newerRecord;
  const relatedCopy = bodySections.relatedCopy;
  const related = relatedReviews(post, archivePosts);
  const canonical = reviewEntryPath(post);
  const description = reviewSeoDescription(post);
  const crumbs = [
    ...reviewsBreadcrumb,
    ...(metadata.category
      ? [{
          name: metadata.category,
          href: `/reviews?category=${encodeURIComponent(metadata.category)}`,
        }]
      : []),
    { name: title, href: canonical },
  ];
  const faqJsonLd = faqPageJsonLd(canonical, faqItems);

  return (
    <MadiPageFrame
      pathname={canonical}
      title={reviewsIndexMetadata.label}
      crumbs={crumbs}
    >
      {notice}
      <JsonLd
        nodes={[
          {
            ...webPageJsonLd({ path: canonical, name: title, description }),
            datePublished: post.publishedAt,
            ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
            ...(reviewImageUrl(post) ? { image: reviewImageUrl(post) } : {}),
          },
          ...(faqJsonLd ? [faqJsonLd] : []),
        ]}
      />
      <div className="cBox review-detail-page clearFix">
        <article className="review-detail" data-track-read={post.id}>
          <div className="reviews-shell review-detail__surface">
            <header className="review-detail__header">
              <div className="article-header-category">
                {metadata.category ? (
                  <Link className="community-category-badge" href={`/reviews?category=${encodeURIComponent(metadata.category)}`}>
                    치료 경험담 · {metadata.category}
                  </Link>
                ) : <span>치료 경험담</span>}
              </div>
              <h2>{title}</h2>
              <div className="article-header-foot">
                <p className="article-header-byline">
                  {metadata.doctor && (isRepresentativeDoctor(metadata.doctor)
                    ? <a href={DOCTOR_PROFILE_HREF}>{metadata.doctor}</a>
                    : <span>{metadata.doctor}</span>)}
                  <time dateTime={post.publishedAt}>{formatReviewDate(post.publishedAt)}</time>
                </p>
                <PreferredSourceLink />
              </div>
              <div className="review-detail__info-row">
                <dl className="review-detail__facts">
                  {metadata.patient && (
                    <div>
                      <dt>환자</dt>
                      <dd>{metadata.patient}</dd>
                    </div>
                  )}
                  {metadata.treatmentPeriod && (
                    <div>
                      <dt>치료 기간</dt>
                      <dd>{metadata.treatmentPeriod}</dd>
                    </div>
                  )}
                  {metadata.category && (
                    <div>
                      <dt>진료 분야</dt>
                      <dd>
                        <Link href={`/reviews?category=${encodeURIComponent(metadata.category)}`}>{metadata.category}</Link>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              {excerpt && <p className="review-detail__summary">{excerpt}</p>}
            </header>
            {originalImageUrl && (
              <figure className="review-detail__original">
                <img
                  src={cfImageVariantUrl(originalImageUrl, 'lg')}
                  srcSet={cfImageSrcSet(originalImageUrl)}
                  sizes="(max-width: 767px) 100vw, 720px"
                  alt={`${title} 후기 원문`}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <figcaption>환자분이 직접 남긴 후기 원문</figcaption>
              </figure>
            )}
            <div className="review-detail__content-grid">
              {bodySections.beforeRelatedHtml ? (
                <div
                  className="review-richtext"
                  dangerouslySetInnerHTML={{ __html: bodySections.beforeRelatedHtml }}
                />
              ) : (
                !bodySections.afterRelatedHtml && (
                  <div className="review-richtext">
                    <p>{excerpt ?? '후기 원문을 이미지로 확인해 주세요.'}</p>
                  </div>
                )
              )}
              {relatedCopy && relatedRecord && (
                <aside className="review-detail__record" aria-label="연관 진료 기록">
                  <span>{relatedCopy.eyebrow}</span>
                  <Link href={reviewEntryPath(relatedRecord)}>{relatedCopy.label}</Link>
                </aside>
              )}
              {bodySections.afterRelatedHtml && (
                <div
                  className="review-richtext"
                  dangerouslySetInnerHTML={{ __html: bodySections.afterRelatedHtml }}
                />
              )}
              <ClinicGuide />
              <aside className="review-detail__note" aria-label="치료 경험담 안내">
                <strong>치료 경험담 안내</strong>
                <p>{reviewDisclosure}</p>
              </aside>
              <ReviewFaq items={faqItems} />
            </div>
            <ArticleNavigation listHref="/reviews" listLabel="후기 목록"
              previous={newerRecord ? { href: reviewEntryPath(newerRecord), title: reviewTitle(newerRecord) } : undefined}
              next={olderRecord ? { href: reviewEntryPath(olderRecord), title: reviewTitle(olderRecord) } : undefined} />
          </div>
        </article>
        {related.length > 0 && (
          <section className="review-related" aria-labelledby="review-related-title">
            <div className="reviews-shell">
              <div className="review-related__head">
                <h2 id="review-related-title">다른 치료 경험</h2>
                <Link href="/reviews">
                  전체 후기 보기 <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="review-related__grid">
                {related.map((item) => (
                  <ReviewCard post={item} key={item.id} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </MadiPageFrame>
  );
}
