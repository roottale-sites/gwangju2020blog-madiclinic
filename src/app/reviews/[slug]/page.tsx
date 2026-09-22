import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import '../../../styles/site/reviews.css';
import '../../../styles/site/review-detail.css';
import '../../../styles/site/review-faq.css';
import '../../../styles/site/post-pattern.css';
import MadiPageFrame from '../../../components/madi/MadiPageFrame';
import ReviewDetailView from '../../../features/reviews/ReviewDetailView';
import { loadReview, loadReviewArchive } from '../../../features/reviews/review-api';
import { reviewsIndexMetadata, reviewTitleWithSuffix } from '../../../features/reviews/review-content';
import { reviewEntryPath, reviewImageUrl, reviewSeoDescription, reviewSeoTitle } from '../../../features/reviews/review-model';
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

  const archive = await loadReviewArchive();
  return <ReviewDetailView post={post} archivePosts={archive.ok ? archive.data : []} />;
}
