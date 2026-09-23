import { beforeEach, expect, test, vi } from 'vitest';

import { reviewFixture } from '../../features/reviews/review-fixture';

vi.mock('../../features/reviews/review-api', () => ({
  loadReview: vi.fn(),
  loadReviewArchive: vi.fn(),
}));

import { loadReview } from '../../features/reviews/review-api';
import { generateMetadata } from './[slug]/page';

beforeEach(() => vi.mocked(loadReview).mockReset());

test('대표 이미지가 없는 후기는 병원 로고를 OG와 Twitter 이미지로 쓴다', async () => {
  vi.mocked(loadReview).mockResolvedValue({ ok: true, data: reviewFixture() });
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'knee-review' }) });
  const image = 'https://gwangju2020blog.madiclinic.co.kr/opengraph-image.png';
  expect(metadata.openGraph).toMatchObject({ images: [image] });
  expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', images: [image] });
});

test('대표 이미지가 있는 후기는 그 이미지를 OG에 우선 적용한다', async () => {
  vi.mocked(loadReview).mockResolvedValue({
    ok: true,
    data: reviewFixture({ featuredImageUrl: 'https://images.example.com/review.png' }),
  });
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'knee-review' }) });
  expect(metadata.openGraph).toMatchObject({ images: ['https://images.example.com/review.png'] });
});
