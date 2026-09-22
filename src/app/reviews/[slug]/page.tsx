import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import '../../../styles/site/reviews.css';
import '../../../styles/site/review-detail.css';
import '../../../styles/site/review-faq.css';
import '../../../styles/site/post-pattern.css';
import MadiPageFrame from '../../../components/madi/MadiPageFrame';
import JsonLd from '../../../components/site/JsonLd';
import ClinicGuide from '../../../features/clinic-guide/ClinicGuide';
import { DOCTOR_PROFILE_HREF, isRepresentativeDoctor } from '../../../features/clinic/doctor-profile-link';
import { cfImageSrcSet, cfImageVariantUrl } from '../../../features/cms/cf-image-url';
import { faqPageJsonLd, webPageJsonLd } from '../../../features/seo/schema';
import ReviewCard from '../../../features/reviews/ReviewCard';
import ReviewFaq from '../../../features/reviews/ReviewFaq';
import { loadReview, loadReviewArchive } from '../../../features/reviews/review-api';
import { renderReviewBodySections } from '../../../features/reviews/review-body';
import {
  reviewDisclosure,
  reviewsIndexMetadata,
  reviewTitleWithSuffix,
} from '../../../features/reviews/review-content';
import { reviewFaqItems } from '../../../features/reviews/review-faq';
import {
  formatReviewDate,
  relatedReviews,
  reviewEntryPath,
  reviewExcerpt,
  reviewImageUrl,
  reviewLeadImageUrl,
  reviewMetadata,
  reviewSeoDescription,
  reviewSeoTitle,
  reviewTitle,
} from '../../../features/reviews/review-model';
import { reviewsBreadcrumb } from '../page';

type ReviewDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

function decodeSlugParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isSameReviewImage(left: string, right: string): boolean {
  return cfImageVariantUrl(left, 'lg') === cfImageVariantUrl(right, 'lg');
}

export async function generateMetadata({ params }: ReviewDetailPageProps): Promise<Metadata> {
  const slug = decodeSlugParam((await params).slug);
  const result = await loadReview(slug);
  if (!result.ok || !result.data) {
    return {
      title: {
        absolute: result.ok
          ? reviewTitleWithSuffix('후기를 찾을 수 없습니다')
          : reviewTitleWithSuffix('후기 연결 오류'),
      },
      description: result.ok
        ? '요청한 후기를 찾을 수 없습니다.'
        : '후기를 일시적으로 불러오지 못했습니다.',
      robots: { index: false, follow: true },
    };
  }

  const post = result.data;
  const imageUrl = reviewImageUrl(post);
  const title = reviewSeoTitle(post);
  const description = reviewSeoDescription(post);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: reviewEntryPath(post) },
    other: { 'rt:content-id': post.id },
    openGraph: {
      type: 'article',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
      publishedTime: post.publishedAt,
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

/**
 * `/reviews/{slug}` 상세.
 *
 * headnerve 상세의 구조(원문 이미지 → 본문 → 연관 기록 패널 → 하단 안내 → 관련
 * 후기 → 이전·다음 글)를 그대로 옮기고 틀만 `MadiPageFrame`(배너 02)으로 바꿨다.
 *
 * headnerve와 다르게 한 곳
 *   - 하단은 진료 안내 박스(`ClinicGuide`, DESIGN.md §5의 `.commonBox`) + 치료경험담
 *     고지 + `ReviewFaq` 세 개다. 예약 CTA 섹션은 진료 안내 박스의 버튼과 겹쳐
 *     빼고, 의료진 카드는 쓸 원장 사진 자산이 없어 뺐다(PLAN.md §8-5).
 *   - 카페 링크(`ContentCafeLink`)는 이 사이트에 카페가 없어 쓰지 않는다.
 */
export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const requestedSlug = decodeSlugParam((await params).slug);
  const result = await loadReview(requestedSlug);
  if (result.ok && !result.data) notFound();
  const post = result.ok ? result.data : null;
  // 주소 이동 이력이 있는 글은 정규 주소로 한 번만 보낸다(ADR-0105).
  if (post && post.slug !== requestedSlug) permanentRedirect(reviewEntryPath(post));

  if (!post) {
    return (
      <MadiPageFrame
        pathname="/reviews"
        title={reviewsIndexMetadata.label}
        banner="02"
        crumbs={reviewsBreadcrumb}
      >
        <div className="cBox review-detail-page clearFix">
          <section className="reviews-state reviews-state--page" aria-labelledby="review-state-title">
            <h2 id="review-state-title">후기를 불러오지 못했습니다</h2>
            <p>잠시 뒤 다시 확인해 주세요.</p>
            <Link className="reviews-state__link" href="/reviews">
              후기 목록으로
            </Link>
          </section>
        </div>
      </MadiPageFrame>
    );
  }

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
  const archive = await loadReviewArchive();
  const archivePosts = archive.ok ? archive.data : [];
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
      banner="02"
      crumbs={crumbs}
    >
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
              <div className="review-detail__meta-row">
                <span>
                  치료 경험담{metadata.category ? ` · ${metadata.category}` : ''}
                </span>
                <time dateTime={post.publishedAt}>{formatReviewDate(post.publishedAt)}</time>
              </div>
              <h2>{title}</h2>
              <dl className="review-detail__facts">
                {metadata.patient && (
                  <div>
                    <dt>환자</dt>
                    <dd>{metadata.patient}</dd>
                  </div>
                )}
                {metadata.doctor && (
                  <div>
                    <dt>{metadata.copiedFrom ? '원문' : '담당'}</dt>
                    <dd>
                      {metadata.copiedFrom ? (<a href={metadata.copiedFrom.url}>{metadata.copiedFrom.name}</a>) : isRepresentativeDoctor(metadata.doctor) ? (
                        <a className="review-card__doctor" href={DOCTOR_PROFILE_HREF}>
                          {metadata.doctor}
                        </a>
                      ) : (
                        metadata.doctor
                      )}
                    </dd>
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
                    <dd>{metadata.category}</dd>
                  </div>
                )}
              </dl>
              {excerpt && <p className="review-detail__summary">{excerpt}</p>}
            </header>
            {originalImageUrl && (
              <figure className="review-detail__original">
                <img
                  src={cfImageVariantUrl(originalImageUrl, 'lg')}
                  srcSet={cfImageSrcSet(originalImageUrl)}
                  sizes="(max-width: 767px) 100vw, 928px"
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
            <nav className="review-detail__navigation" aria-label="이전글 다음글">
              {newerRecord ? (
                <Link href={reviewEntryPath(newerRecord)}>
                  <span>이전글</span>
                  {reviewTitle(newerRecord)}
                </Link>
              ) : (
                <span />
              )}
              <Link className="review-detail__list-link" href="/reviews">
                후기 목록
              </Link>
              {olderRecord ? (
                <Link href={reviewEntryPath(olderRecord)}>
                  <span>다음글</span>
                  {reviewTitle(olderRecord)}
                </Link>
              ) : (
                <span />
              )}
            </nav>
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
