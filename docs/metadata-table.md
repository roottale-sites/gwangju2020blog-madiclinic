# 메타데이터 표

`<title>`·`description`의 확정값 원장이다. 코드를 바꾸기 전에 이 표를 먼저 고친다.

`<title>`은 레이아웃 template(`%s | 광주 남구 마디클리닉 블로그`)을 거치지 않는
절대값이다(`metadata.title.absolute`). 세 기능의 제목이 두 번 사이트 이름을 달지
않게 하려는 것이며, 값의 단일 출처는 각 기능의 `*-content.ts`다.

## 공통 404

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| 존재하지 않는 경로 | 페이지를 찾을 수 없습니다 \| 광주 남구 마디클리닉 | 요청하신 페이지를 찾을 수 없습니다. 블로그, 자주 묻는 질문, 후기 또는 병원 홈페이지에서 필요한 정보를 확인해 주세요. | `noindex, follow`. 공통 헤더·푸터와 커뮤니티·병원 바로가기 제공 |

없는 후기에는 같은 404 디자인과 아래 후기 전용 안내 문구를 사용한다.

## 블로그(칼럼)

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/column` | 광주 남구 마디클리닉 블로그 | 광주 남구 마디클리닉 이경무 대표원장이 통증의 원인과 비수술 중점치료를 직접 씁니다. 영상유도하 통증중재시술 의료기관. | `columnIndexMetadata`. `?q=`·`?page=2`는 `noindex, follow` |
| `/column/{category}` | {분류 SEO 제목} | {분류 SEO 설명}, 비어 있으면 `/column` 설명 | CMS 공개 분류 API의 `seo_title`을 완전한 제목으로 사용한다. 비어 있으면 분류 이름을 쓴다(PLAN.md §4.2) |
| `/column/{category}/{slug}` | {글 제목} \| 광주 남구 마디클리닉 블로그 | 글의 `seo.description` → 발췌문 → 기본 문구(160자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105) |
| 없는 분류·글 | 공통 404 제목 | 공통 404 설명 | `noindex, follow` |

## 후기

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/reviews` | 치료후기 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉에서 치료받은 분들이 직접 남긴 치료 경험담입니다. | `reviewsIndexMetadata`. `?category=`·`?page=2`는 `noindex, follow`이고 canonical은 `/reviews` 고정 |
| `/reviews?category={분류}` | {분류} 치료후기 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉의 {분류} 치료 경험담입니다. 개인의 경험은 서로 다를 수 있습니다. | 분류는 CMS 글에 붙은 분류 이름이다 |
| `/reviews/{slug}` | 글의 `seo.title`, 없으면 {후기 제목} \| 치료후기 \| 광주 남구 마디클리닉 | 글의 `seo.description` → 발췌문 → 목록 설명(180자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105). 옛 slug 요청은 정규 주소로 308 |
| 없는 후기 | 후기를 찾을 수 없습니다 \| 치료후기 \| 광주 남구 마디클리닉 | 요청한 후기를 찾을 수 없습니다. | `noindex, follow` |
| CMS 장애 | 후기 연결 오류 \| 치료후기 \| 광주 남구 마디클리닉 | 후기를 일시적으로 불러오지 못했습니다. | `noindex, follow`. 404가 아니라 200 + 상태 안내(나중에 살아날 주소다) |

## 자주 묻는 질문

네 단계 모두 `<title>`이 절대값이고, 분류 문구는 CMS 공개 분류 API(`seo_title`·
`seo_description`·`description`)에서 읽는다. 코드에는 분류를 두지 않는다(PLAN.md §4.2).
문구가 비어 있을 때 쓰는 조립 서식만 `faq-content.ts`가 소유한다.

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/faq` | 질환별 자주 묻는 질문 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉 이경무 대표원장이 진료실에서 자주 받는 질문에 답합니다. 통증의 원인과 검사, 비수술 중점치료와 경과를 확인하세요. | `faqIndexMetadata` |
| `/faq/{section}` | {영역 `seo_title`, 없으면 `{영역 이름} 자주 묻는 질문`} \| 광주 남구 마디클리닉 | 영역 `seo_description` → `description` → `{영역 이름}에 관해 진료실에서 자주 받는 질문과 답변입니다.` | 진료 영역(1단계 분류) |
| `/faq/{section}/{topic}` | {질환 `seo_title`, 없으면 `{질환 이름} 자주 묻는 질문`} \| 광주 남구 마디클리닉 | 질환 `seo_description` → `description` → `{질환 이름}의 증상·검사·치료와 경과에 관해 자주 묻는 질문입니다.` | 세부 질환(2단계 분류). `?intent=`는 `noindex, follow`이고 canonical은 이 주소 고정 |
| `/faq/{section}/{topic}/{slug}` | {질문} \| 광주 남구 마디클리닉 | 핵심 답변(160자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105). `rt:content-id`로 조회수를 귀속한다 |
| 없는 영역·질환·질문 | 공통 404 제목 | 공통 404 설명 | CMS 성공 응답에서만 404다. 공통 404 화면과 `noindex, follow` 적용 |
| CMS 장애·키 미설정·모델 미선언 | 자주 묻는 질문 연결 오류 \| 광주 남구 마디클리닉 | 상태별 안내 문구(`faqNotices`) | `noindex, follow`. 404가 아니라 200 + 상태 안내(나중에 살아날 주소다) |

## SEO 라우트

| URL | 내용 |
|---|---|
| `/sitemap.xml` | 사이트맵 인덱스. 자식 4개(`/sitemap-static.xml`·`/reviews-sitemap.xml`·`/column-sitemap.xml`·`/faq-sitemap.xml`) |
| `/sitemap-static.xml` | 정적 목록 `/column`·`/reviews`·`/faq` |
| `/column-sitemap.xml` | 칼럼 목록·분류·글 |
| `/reviews-sitemap.xml` | 후기 목록·글 |
| `/faq-sitemap.xml` | FAQ 홈 + 글이 있는 영역·질환 + 답변 |
| `/column/rss.xml`, `/reviews/rss.xml`, `/faq/rss.xml` | 섹션별 피드 |
| `/column/sitemap.xml`, `/reviews/sitemap.xml`, `/faq/sitemap.xml` | 기존 전용 사이트맵과 같은 내용을 제공하는 섹션 주소 |
| `/robots.txt` | `Disallow: /preview/`, `Sitemap: https://gwangju2020blog.madiclinic.co.kr/sitemap.xml` |

공유 메타데이터는 대응되는 [headnerve.com](https://headnerve.com/sitemap.xml)의 URL 계층을 따른다. 원래 병원 사이트의 `og:image`가 비어 있어 헤더 로고로 만든 1200×630 이미지를 기본 OG 이미지로 쓴다. 칼럼·후기 상세는 공개 글의 대표 이미지를 우선하고, 없으면 이 기본 이미지를 쓴다. OG 사이트 이름은 `광주 남구 마디클리닉`이다.

사이트맵과 RSS의 XML 표시 형식은 [avcd 사이트맵](https://avcd.kr/sitemap.xml)·[avcd RSS](https://avcd.kr/blog/rss.xml)를 참고한다. 콘텐츠 주소와 수정일은 이 사이트의 원장을 사용한다.

## 전역 구조화 데이터

`src/app/layout.tsx`가 모든 페이지에 `WebSite`·`MedicalClinic`(마디클리닉)·
`Physician`(이경무) 세 노드를 넣는다(`siteEntityJsonLd`). 페이지별로는 목록·분류가
`CollectionPage`, 상세가 `WebPage`이고 칼럼 상세는 `Article`, FAQ 상세는 `FAQPage`,
후기 상세는 후기 FAQ 블록이 있을 때 `FAQPage`를 더한다. `BreadcrumbList`는
`MadiBreadcrumb`이 화면 브레드크럼과 같은 배열에서 만든다.
