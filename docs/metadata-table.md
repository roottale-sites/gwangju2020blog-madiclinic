# 메타데이터 표

`<title>`·`description`의 확정값 원장이다. 코드를 바꾸기 전에 이 표를 먼저 고친다.

`<title>`은 레이아웃 template(`%s | 광주 남구 마디클리닉 블로그`)을 거치지 않는
절대값이다(`metadata.title.absolute`). 세 기능의 제목이 두 번 사이트 이름을 달지
않게 하려는 것이며, 값의 단일 출처는 각 기능의 `*-content.ts`다.

## 블로그(칼럼)

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/column` | 블로그 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉 이경무 대표원장이 통증의 원인과 비수술 중점치료를 직접 씁니다. 영상유도하 통증중재시술 의료기관. | `columnIndexMetadata`. `?q=`·`?page=2`는 `noindex, follow` |
| `/column/{category}` | {분류 SEO 제목} \| 블로그 \| 광주 남구 마디클리닉 | {분류 SEO 설명}, 비어 있으면 `/column` 설명 | 분류 문구는 CMS 공개 분류 API(`seo_title`·`seo_description`)에서 읽는다. 코드에 분류를 두지 않는다(PLAN.md §4.2) |
| `/column/{category}/{slug}` | {글 제목} \| 블로그 \| 광주 남구 마디클리닉 | 글의 `seo.description` → 발췌문 → 기본 문구(160자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105) |
| 없는 글 | 글을 찾을 수 없습니다 \| 블로그 \| 광주 남구 마디클리닉 | 요청한 글을 찾을 수 없습니다. | `noindex, follow` |

## 후기

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/reviews` | 후기 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉에서 치료받은 분들이 직접 남긴 치료 경험담입니다. | `reviewsIndexMetadata`. `?category=`·`?page=2`는 `noindex, follow`이고 canonical은 `/reviews` 고정 |
| `/reviews?category={분류}` | {분류} 후기 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉의 {분류} 치료 경험담입니다. 개인의 경험은 서로 다를 수 있습니다. | 분류는 CMS 글에 붙은 분류 이름이다 |
| `/reviews/{slug}` | 글의 `seo.title`, 없으면 {후기 제목} \| 후기 \| 광주 남구 마디클리닉 | 글의 `seo.description` → 발췌문 → 목록 설명(180자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105). 옛 slug 요청은 정규 주소로 308 |
| 없는 후기 | 후기를 찾을 수 없습니다 \| 후기 \| 광주 남구 마디클리닉 | 요청한 후기를 찾을 수 없습니다. | `noindex, follow` |
| CMS 장애 | 후기 연결 오류 \| 후기 \| 광주 남구 마디클리닉 | 후기를 일시적으로 불러오지 못했습니다. | `noindex, follow`. 404가 아니라 200 + 상태 안내(나중에 살아날 주소다) |

## 자주 묻는 질문

7단계에서 기록한다.
