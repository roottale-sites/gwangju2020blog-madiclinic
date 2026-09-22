import type { Metadata } from 'next';

import MadiNotFound from '../../../components/madi/MadiNotFound';
import { reviewTitleWithSuffix } from '../../../features/reviews/review-content';

export const metadata: Metadata = {
  title: { absolute: reviewTitleWithSuffix('후기를 찾을 수 없습니다') },
  description: '요청한 후기를 찾을 수 없습니다.',
  robots: { index: false, follow: true },
};

/** 공개가 끝났거나 주소가 바뀐 후기에도 공통 복귀 안내를 제공한다. */
export default function ReviewNotFound() {
  return (
    <MadiNotFound
      title="후기를 찾을 수 없습니다"
      message="주소가 바뀌었거나 공개가 종료된 후기입니다."
    />
  );
}
