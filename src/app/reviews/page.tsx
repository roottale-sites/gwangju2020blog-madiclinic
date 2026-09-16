import type { Metadata } from 'next';

import '../../styles/site/reviews.css';
import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import { webPageJsonLd } from '../../features/seo/schema';
import ReviewCard from '../../features/reviews/ReviewCard';
import { loadReviewArchive } from '../../features/reviews/review-api';
import { reviewsIndexMetadata } from '../../features/reviews/review-content';
import {
  filterReviews,
  paginateReviews,
  parsePageNumber,
  reviewCategories,
} from '../../features/reviews/review-model';

type ReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 데이터는 24시간 `unstable_cache`가 잡고 렌더링은 요청 시점에 한다. 정적
 * 프리렌더를 하면 빌드 순간의 CMS 상태가 굳어 런타임 비밀값·장애가 반영되지 않는다.
 */
export const dynamic = 'force-dynamic';

/** 목록·상세·상세 404가 함께 쓰는 브레드크럼. 첫 칸(홈)은 `MadiBreadcrumb`이 그린다. */
export const reviewsBreadcrumb = [
  { name: '커뮤니티', href: '/column' },
  { name: reviewsIndexMetadata.label, href: '/reviews' },
] as const;

function firstValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0]?.trim() || null : value?.trim() || null;
}

function reviewsUrl(page: number, category: string | null): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/reviews${query ? `?${query}` : ''}`;
}

function reviewsPaginationUrl(page: number, category: string | null): string {
  return `${reviewsUrl(page, category)}#reviews-list-title`;
}

/** 분류·페이지 상태는 정규 주소가 아니므로 상위 목록을 canonical로 유지한다. */
export async function generateMetadata({ searchParams }: ReviewsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = firstValue(params.category);
  const page = parsePageNumber(firstValue(params.page));
  const title = category
    ? `${category} ${reviewsIndexMetadata.title}`
    : page > 1
      ? `${reviewsIndexMetadata.label} ${page}페이지 | 광주 남구 마디클리닉`
      : reviewsIndexMetadata.title;
  const description = category
    ? `광주 남구 마디클리닉의 ${category} 치료 경험담입니다. 개인의 경험은 서로 다를 수 있습니다.`
    : reviewsIndexMetadata.description;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: '/reviews',
      types: { 'application/rss+xml': '/reviews/rss.xml' },
    },
    robots: category || page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  };
}

/**
 * `/reviews` 목록.
 *
 * headnerve `app/reviews/page.tsx`의 본문·상태 분기를 그대로 옮기고 틀만
 * `MadiPageFrame`(배너 02)으로 바꿨다. `SitePageHero`·`FinalCta`·`DiseaseClosing`은
 * 쓰지 않는다(PLAN.md §2.2).
 */
export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const result = await loadReviewArchive();
  const allReviews = result.ok ? result.data : [];
  const categories = reviewCategories(allReviews);
  const requestedCategory = firstValue(params.category);
  const activeCategory =
    requestedCategory && categories.includes(requestedCategory) ? requestedCategory : null;
  const filteredReviews = filterReviews(allReviews, activeCategory);
  const reviewPage = paginateReviews(filteredReviews, parsePageNumber(firstValue(params.page)));
  const noResults = Boolean(requestedCategory) && !activeCategory;

  return (
    <MadiPageFrame
      pathname="/reviews"
      title={reviewsIndexMetadata.label}
      banner="02"
      crumbs={reviewsBreadcrumb}
    >
      <JsonLd
        nodes={[
          webPageJsonLd({
            path: '/reviews',
            name: reviewsIndexMetadata.title,
            description: reviewsIndexMetadata.description,
            type: 'CollectionPage',
          }),
        ]}
      />
      <div className="cBox reviews-page clearFix">
        <h2 className="reviews-page__title">{reviewsIndexMetadata.label}</h2>
        <section className="reviews-archive" aria-labelledby="reviews-list-title">
          <div className="reviews-shell">
            <div className="reviews-archive__bar">
              <h2 id="reviews-list-title">{reviewsIndexMetadata.label} 목록</h2>
              {result.ok && <p>총 {filteredReviews.length}건</p>}
            </div>
            {categories.length > 0 && (
              <nav className="reviews-filter" aria-label="후기 분류">
                <a href="/reviews" aria-current={!activeCategory ? 'page' : undefined}>
                  전체
                </a>
                {categories.map((category) => (
                  <a
                    href={reviewsUrl(1, category)}
                    aria-current={activeCategory === category ? 'page' : undefined}
                    key={category}
                  >
                    {category}
                  </a>
                ))}
              </nav>
            )}
            {!result.ok ? (
              <section className="reviews-state" aria-labelledby="reviews-error-title">
                <h2 id="reviews-error-title">
                  {result.reason === 'unconfigured'
                    ? '후기를 준비하고 있습니다'
                    : '후기를 불러오지 못했습니다'}
                </h2>
                <p>
                  {result.reason === 'unconfigured'
                    ? '치료 경험담을 곧 올릴 예정입니다. 진료 문의는 대표전화로 도와드립니다.'
                    : '잠시 뒤 다시 확인해 주세요. 진료 문의는 대표전화로 도와드립니다.'}
                </p>
                <a className="reviews-state__link" href="/reviews">
                  다시 시도하기
                </a>
              </section>
            ) : noResults ? (
              <section className="reviews-state" aria-labelledby="reviews-no-results-title">
                <h2 id="reviews-no-results-title">해당 분류를 찾을 수 없습니다</h2>
                <p>전체 후기에서 다른 치료 경험을 확인해 보세요.</p>
                <a className="reviews-state__link" href="/reviews">
                  전체 후기 보기
                </a>
              </section>
            ) : reviewPage.items.length === 0 ? (
              <section className="reviews-state" aria-labelledby="reviews-empty-title">
                <h2 id="reviews-empty-title">등록된 후기를 준비하고 있습니다</h2>
                <p>진료에 관해 궁금한 점은 예약 전 상담으로 확인할 수 있습니다.</p>
              </section>
            ) : (
              <div className="reviews-grid">
                {reviewPage.items.map((post) => (
                  <ReviewCard post={post} key={post.id} />
                ))}
              </div>
            )}
            {result.ok && !noResults && reviewPage.pageCount > 1 && (
              <nav className="reviews-pagination" aria-label="후기 페이지">
                <div className="reviews-pagination__direction">
                  {reviewPage.page > 1 && (
                    <a
                      href={reviewsPaginationUrl(reviewPage.page - 1, activeCategory)}
                      rel="prev"
                    >
                      ← 이전
                    </a>
                  )}
                </div>
                <ol className="reviews-pagination__pages">
                  {Array.from({ length: reviewPage.pageCount }, (_, index) => index + 1).map(
                    (page) => (
                      <li key={page}>
                        <a
                          href={reviewsPaginationUrl(page, activeCategory)}
                          aria-current={page === reviewPage.page ? 'page' : undefined}
                          aria-label={`${page}페이지`}
                        >
                          {page}
                        </a>
                      </li>
                    ),
                  )}
                </ol>
                <div className="reviews-pagination__direction reviews-pagination__direction--next">
                  {reviewPage.page < reviewPage.pageCount && (
                    <a
                      href={reviewsPaginationUrl(reviewPage.page + 1, activeCategory)}
                      rel="next"
                    >
                      다음 →
                    </a>
                  )}
                </div>
              </nav>
            )}
          </div>
        </section>
      </div>
    </MadiPageFrame>
  );
}
