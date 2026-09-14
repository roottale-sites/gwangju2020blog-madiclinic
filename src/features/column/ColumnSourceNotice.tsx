import type { ColumnSourceStatus } from './column-source';

/**
 * CMS를 읽을 수 없을 때의 안내.
 *
 * headnerve는 이 두 상태에서 이관 JSON 88건을 대신 보여 줬다. 이 저장소에는 폴백
 * 콘텐츠가 없으므로(PLAN.md §5.3) 빈 목록 대신 이유를 밝힌다 — 사용자에게는
 * "글이 없다"와 "지금 불러올 수 없다"가 다른 사실이다.
 */
export default function ColumnSourceNotice({ status }: Readonly<{ status: ColumnSourceStatus }>) {
  if (status === 'ok') return null;

  return (
    <p className="column-notice" role="status">
      {status === 'unconfigured'
        ? '블로그 준비 중입니다. 곧 글을 올릴 예정입니다.'
        : '지금은 글 목록을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.'}
    </p>
  );
}
