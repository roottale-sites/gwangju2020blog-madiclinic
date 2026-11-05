# 사이트 내용 편집 범위

2026-11-05 로컬 구현. 운영 설치본은 v6이며 이 작업은 v7 계약과 초기 문서를 준비했다. 운영에는 적용하지 않았다. 필드·초기값·문서 ID의 정본은 [content-import.json](../cms/content-import.json), 계약은 [site-content-contract.json](../cms/site-content-contract.json)이다.

## 문서와 표시 위치

| 모델 | 관리자 이름 | 목록 위치 | 공개 연결 |
|---|---|---|---|
| `clinic-common` | 공통 병원 안내 | `/column`, `/reviews`, `/faq` 공통 | 공통 푸터, 상세 공통 버튼·제목, 병원·의사 JSON-LD |
| `column-footer` | 블로그 하단 안내 | `/column` | 칼럼 상세 진료 안내·의료 콘텐츠 안내 |
| `reviews-footer` | 후기 하단 안내 | `/reviews` | 후기 상세 진료 안내·치료 경험담 안내 |
| `faq-footer` | FAQ 하단 안내 | `/faq` | FAQ 상세 진료 안내·읽기 전 확인 안내 |

공유 모델은 `shared: true`, `presentation.kind: data_only`다. 자체 홈·소개 페이지가 없으므로 `pages`는 비어 있다. 글의 모델·메타데이터·팝업 슬롯·`column-footer-image` 고정 패턴을 보존하며 `patternManagement`는 바꾸지 않았다. 후기에는 이 사이트에 없는 예약 CTA나 별도 의료진 카드를 추가하지 않았다. FAQ의 의료 고지는 실제 화면대로 답변 카드 안의 기존 위치에 연결한다.

네 모델은 값을 자동 공유하지 않는다. 같은 전화·주소·시간이 초기값에 반복되더라도 각 하단은 자기 문서만 읽는다. `clinic-common`은 공통 푸터·JSON-LD·`ContentCafeLink`·`page_common`에서 실제로 읽는 칸만 보관한다. 진료시간·휴진·점심·오시는 길·안내 카드 이름·상세 주소·사진 설명·네이버톡톡 주소는 공개 상세의 각 하단 문서가 소유하며 공통 문서에는 없다. `src/data/clinic.ts`의 원본 값은 하단 기본값으로 유지한다.

각 문서의 전화번호는 `phone_display` 한 칸에서 받는다. 유효한 국내 번호의 맨 앞 0을 국가번호로 바꿔 JSON-LD에 쓰고, 하이픈을 지워 전화 링크를 만든다. 기본값 `062-675-0750`은 `tel:0626750750`과 `+82-62-675-0750`이 된다. 형식이 맞지 않으면 전화 링크와 JSON-LD `telephone`을 생략한다. 별도 `phone_tel`·`phone_e164` 칸은 없다. `Person.jobTitle`은 공통 `representative_title`을 읽으며 별도 검색 직함 칸도 없다.

## 편집 칸과 값 처리

병원 사실은 `src/data/clinic.ts`, 카드·공통 라벨은 `src/features/site-content/defaults.ts`에서 원문 그대로 가져온다. `pnpm cms:content:export`는 계약·모델·필드 그룹·초기 문서를 재생성하며 `identityMap`의 문서 ID와 반복행 `_id`를 유지한다. 기존 운영 문서나 병원이 수정한 값을 덮어쓰는 도구가 아니다.

누락된 키는 키별 코드 기본값을 쓴다. 저장된 빈 문자열·공백은 그대로 받아 해당 줄·버튼을 숨긴다. 버튼에는 문구와 유효한 주소가 모두 필요하다. 주소는 HTTPS·내부 경로·`tel:`·`mailto:`만 허용하고 자바스크립트·data·프로토콜 상대 주소·인증정보 URL·공백·역슬래시를 거부한다. 의료 고지 제목·본문은 비어도 코드 원문을 표시하며 계약에서 숨김·삭제를 허용하지 않는다.

`shared.physician.alternate_name`의 관리자 칸 이름은 사용자 지정대로 `alternateName`이다. 초기값은 빈칸이다. 값이 있을 때만 대표원장 `Person` 항목의 `alternateName`에 출력한다. 공개 화면·미리보기 카드·미리보기 아래 목록에는 출력하지 않으며 관리자 항목 목록에서만 편집한다. [편집 범위 예외](../cms/edit-coverage-exceptions.json)에 이유를 기록했다. 실제 활동명은 입력하지 않았다.

## 미리보기와 공개 런타임

`/preview/content/:id?token=…`는 SDK `fetchPostPreview` 결과의 문서 ID와 `visualTarget.entityId`를 모두 확인한다. 토큰 누락·배열·ID 불일치·키 누락·API 실패는 404다. `checkPreviewCompatibility`는 배포 receipt의 계약 checksum과 템플릿 버전을 검사한다.

`data-rt-edit`는 미리보기 대상 문서에만 붙는다. 카드에서 보이지 않는 URL·검색 값과 조건 때문에 사라진 문구는 카드 아래 `<dl>`에서 클릭한다. 빈 값은 `<dd>`에 `비어 있음`으로 표시하고 이 목록의 편집 표식은 `<dd>`에만 둔다. 화면에 보이는 값은 목록에 중복하지 않는다. 카드가 숨겨졌으면 카드와 그 목록 모두 숨긴다. `clinic-common` 미리보기는 실제 `MadiFooter`와 그 아래 목록만 그린다. 각 하단 문서는 자기 진료 안내 카드를 한 번 그린다. 공개 화면에는 편집 주소가 없다.

Proxy는 경로로 미리보기를 판별하고 외부 요청의 내부 헤더를 지운다. 공유 문서 편집 미리보기(`/preview/content/*`)만 `private, no-store`, `noindex, nofollow`, `no-referrer`이며 관리자 origin을 CSP와 편집 브리지에 함께 전달한다. 기본은 `https://admin.roottale.com`, `https://admin.web.ai.kr`이고 `ROOTTALE_VISUAL_EDITOR_ORIGINS`로 추가한다. 공유 문서 편집 미리보기 layout은 공개 헤더·푸터·팝업·분석·GTM·병원 JSON-LD를 넣지 않는다. 공유 문서 편집 미리보기 자체도 JSON-LD를 넣지 않는다. `/preview/post/*`는 이 내부 표식과 편집용 응답 헤더를 적용하지 않으며 기존 글 미리보기 응답 정책을 유지한다. 글 상세·masthead의 공통 버튼·공개 layout 푸터·JSON-LD는 발행된 공유 문서 값을 읽고 헤더·이미지 라이트박스·팝업을 유지한다. 글 미리보기의 동적 렌더와 페이지 metadata의 noindex도 유지한다.

공개 공유 문서는 `React.cache`와 300초 태그 캐시로 한 조회 결과를 푸터·상세·JSON-LD에서 재사용한다. 모델별로 캐시하고 실패는 캐시 함수 밖에서 그 모델만 기본값으로 처리한다. 실패 응답은 캐시하지 않아 다음 요청에서 바로 재조회하고 성공한 다른 모델의 캐시는 유지한다. 중복 문서도 그 모델만 기본값으로 돌린다. API 키는 캐시 함수 안에서 읽으며 `unstable_cache` 인자·키에 넣지 않는다. API 키가 없으면 조회하지 않으며 페이지를 중단하지 않는다. `ROOTTALE_SITE_CONTENT_MODE`는 필요 없어 추가하지 않았다. 발행·수정·비공개·삭제의 `post.*` 웹훅은 `CONTENT_EDITING_CACHE_TAG`와 해당 목록·상세 패턴을 갱신한다. 공통 병원 안내는 루트 layout도 갱신한다.

## 발행 확인 범위

`clinic-common.sharedFieldVerification.paths`는 고정 경로 `/column` 하나다. 푸터의 사업자번호·대표자·직함·주소·전화·팩스·이메일·저작권 8개 값을 `clinic` 섹션으로 선언한다. 전화·팩스는 `normalization: phone`, 나머지는 `text`다. 연결 주소·JSON-LD 전용 값·상세 공통 버튼 문구는 선언하지 않는다. 하단 문서 3개는 글 상세에서만 보이므로 `sharedFieldVerification`을 생략한다.

발행 문서가 있는 공개 렌더의 값 요소에 `data-rt-shared-section="clinic-common:clinic"`, `data-rt-field-check="<문서 ID>:<field key>"`를 붙인다. 라벨이 섞이는 줄은 값만 `<span>`으로 감싼다. 문서가 없으면 표식·추가 래퍼 없이 기존 HTML을 유지한다. 공유 편집 미리보기는 `data-rt-edit`만 쓴다. `verification.test.tsx`는 플랫폼 `compareSharedFields`와 같은 규칙으로 보이는 텍스트·섹션·문서 ID·정규화를 비교하며 라벨 혼입·오래된 중복·숨김·script 속 표식을 거부한다.

## 코드에 남긴 문구와 이유

- `src/data/nav.ts`의 메뉴 이름·지점 탭·외부 링크, 헤더·드로어와 푸터의 구조용 탐색 메뉴: 본 사이트 탐색 구조와 1px 재현 CSS 선택자 계약을 유지한다. 이 메뉴가 참조하는 채널 주소는 사이트 내용 수정과 별개다.
- `clinic.name`, `nameEn`, `logoAlt`, `siteOrigin`·`mainSiteOrigin` 및 절대 주소 생성 함수: 사이트 이름·로고 대체 텍스트·조직 엔티티·`og:site_name`·정식 URL은 코드 소유다. 원장 사진 파일 경로와 치수도 디자인 자산이므로 고정한다.
- 404의 제목·설명·추천 링크·버튼, 빈 목록·통신 장애·미리보기 오류·만료 안내: 콘텐츠 값이 아니라 실제 실행 상태를 알리는 시스템 문구다.
- 위치 표시줄과 그 JSON-LD, 분류 이름·글 제목·글 본문·상세 목차: 위치 표시줄은 구조이고 분류와 본문은 기존 글 CMS 계약 소유다. 분류 경로와 연결되는 서브 배너·목록 제목도 구조용 문구를 유지한다.
- `POST_AUTHOR_NAME`, `DOCTOR_PROFILE_HREF`, `isRepresentativeDoctor`, FAQ 검수자·RSS 작성자: 글 작성·검수·후기 담당자 판정과 외부 원장 프로필 계약에 묶여 있다. 공통 원장 이름 변경으로 기존 후기 담당자 링크 판정이 달라지지 않도록 보존했다. 후기의 환자·치료 기간 라벨과 글별 FAQ는 기존 글 계약에 남는다.
- 접근성 `aria-label`, 장식 이미지의 빈 alt, 새 창·목차·검색·페이지 이동·개수·로딩 등 구조용 UI 안내: 상태·탐색 기능과 같이 검증해야 하므로 코드 소유다. 카페 질문·선호 출처·이전글·다음글·블로그/후기 목록·관련 후기 제목·전체 후기 버튼의 보이는 문구는 `page_common`으로 연결했다. Google 선호 출처 주소는 서비스 규격과 사이트 origin으로 계산한다.
- 검색 제목·설명·OG 기본값과 글 SEO 정책: 이미 있는 metadata 계약 소유다. 의료 문구 윤문, `htmlLimitedBots`, `Person` 전환, `reviewedBy`, 칼럼 날짜 필드 같은 보강은 이 계약에 포함하지 않는다.

## 로컬 검증 근거

`public-baseline.json`은 수정 전 푸터·진료 안내·FAQ 고지를 렌더한 기준값이다. 문서 누락 시 HTML 전체 일치, 초기 발행 문서는 확인 표식만 제외한 HTML·클래스·링크 일치를 비교한다. `shared-content.test.tsx`는 빈 값·주소 제한·독립성·고지 유지·JSON-LD를 확인한다. `edit-coverage.test.tsx`는 실제 미리보기 DOM의 클릭 주소를 SDK `coverageReport`로 필드 정의·계약·반복행 ID와 대조한다. 비워진 문구와 숨김 섹션도 확인한다. `edit-reachability.test.tsx`는 실제 세 상세 컴포넌트에 공통값이 전달되는지와 공통 문서의 모든 문자열 칸에 공개 소비처가 있는지 확인한다. `preview.test.tsx`는 인증·ID·호환성·격리·응답 헤더, `source.integration.test.tsx`는 실제 Next 캐시와 발행 후 공개값 갱신을 확인한다.

로컬 가짜 CMS로 공개 화면의 값 반영·빈 값 숨김·위험 주소 거부와 공유 문서 미리보기를 Aside PC·390px에서 확인했다. 운영 데이터는 쓰지 않았다. 관리자 iframe 연결과 클릭 후 입력칸 선택은 운영 적용 뒤 확인한다.
