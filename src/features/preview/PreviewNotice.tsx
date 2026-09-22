import type { ReactNode } from 'react';
import MadiPageFrame from '../../components/madi/MadiPageFrame';

export function PreviewNotice({ expiresAt }: Readonly<{ expiresAt: string }>) {
  const date = new Date(expiresAt);
  const expiry = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul',
  }).format(date);
  return <div className="column-shell"><p className="column-preview-notice" role="status">
    <strong>미리보기</strong> — 저장 전 내용이며 검색에 노출되지 않습니다.
    {expiry ? ` ${expiry}까지 볼 수 있어요.` : ''}
  </p></div>;
}

export function PreviewMessage({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return <MadiPageFrame pathname="/column" title="미리보기" banner="01"
    crumbs={[{ name: '커뮤니티', href: '/column' }]}>
    <div className="cBox column-detail-page clearFix"><div className="column-shell">
      <section className="column-preview-message" aria-live="polite"><h2>{title}</h2><p>{children}</p></section>
    </div></div>
  </MadiPageFrame>;
}
