import type { ContentSource } from '../cms/content-source';
import type { ReactNode } from 'react';

import { clinic } from '../../data/clinic';
import { DOCTOR_PROFILE_HREF } from '../clinic/doctor-profile-link';
import { faqMedicalNote, faqNotices } from './faq-content';
import type { FaqSourceStatus } from './faq-source';

/**
 * FAQ 네 단계가 같이 쓰는 조각.
 *
 * headnerve와 다르게 한 곳
 *   - `FaqTopBreadcrumb`(본문 안 두 번째 브레드크럼)은 없다. 골격의 `MadiBreadcrumb`
 *     띠가 그 역할을 이미 한다.
 *   - `ContentCafeLink`(네이버 카페 질문 링크)는 쓰지 않는다 — 이 병원에는 카페가
 *     없다(PLAN.md §5.2 `cafeUrl` 없음).
 *   - `FaqReviewer`의 의사 사진(`lee-jaesung.webp`)을 뺐다. 쓸 원장 사진 자산이
 *     없어(PLAN.md §8-5) 후기 카드와 같이 이름 링크만 둔다.
 */

/** 답변을 쓴 사람. 프로필은 본 사이트가 단일 출처다. */
export function FaqReviewer({ detail, source }: Readonly<{ detail: string; source?: ContentSource }>) {
  if (source) {
    return (
      <div className="faq-reviewer">
        <a className="faq-reviewer__name" href={source.url}>원문: {source.name}</a>
        <span className="faq-reviewer__detail">원문을 복사한 참고 자료</span>
      </div>
    );
  }
  return (
    <div className="faq-reviewer">
      <a className="faq-reviewer__name" href={DOCTOR_PROFILE_HREF}>
        {clinic.name} {clinic.representative} {clinic.representativeTitle}
      </a>
      <span className="faq-reviewer__detail">{detail}</span>
    </div>
  );
}

export function FaqSidebarBox({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="faq-sidebar-box">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function FaqMedicalNote() {
  return (
    <aside className="faq-medical-note" aria-label="의료 정보 안내">
      <strong>{faqMedicalNote.title}</strong>
      <p>{faqMedicalNote.body}</p>
    </aside>
  );
}

/**
 * CMS를 읽을 수 없을 때의 안내.
 *
 * `unconfigured`(비밀값 없음)·`no-model`(모델 미선언)·`upstream`(CMS 장애)은 서로
 * 다른 사실이라 문구도 다르다. 빈 화면을 내보내면 "질문이 없다"고 잘못 알린다.
 */
export function FaqSourceNotice({ status }: Readonly<{ status: FaqSourceStatus }>) {
  if (status === 'ok') return null;
  return (
    <p className="faq-notice" role="status">
      {faqNotices[status]}
    </p>
  );
}

export function FaqEmpty({ message }: Readonly<{ message: string }>) {
  return <p className="faq-empty">{message}</p>;
}
