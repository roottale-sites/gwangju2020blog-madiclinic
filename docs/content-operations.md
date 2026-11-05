# 사이트 내용 운영 적용 순서

이 문서는 계약 v7을 운영에 적용한 순서다. 운영 설치본은 v7이다(2026-11-05 적용).

처음 설치할 때 실제로 쓴 순서와 주의점이다(2026-11-05). 결과는 [TODO](TODO.md)에 있다.

- `site:content-contract:sync`는 화면 편집 템플릿의 필드 그룹이 DB에 없으면 멈춘다. 그래서 플랫폼 importer의 `provisionImportModelsAndFields`로 모델·필드 그룹을 먼저 만들고 sync한 뒤 plan·publish했다. plan에서 모델·필드는 모두 `reuse`로 나온다.
- `--source-root`는 manifest `source.commit`의 깨끗한 체크아웃이어야 한다. 병합은 그 커밋이 main에 남도록 merge commit으로 했다.
- 플랫폼 단건 발행 알림에는 `modelKey`가 없다. 수신 코드는 `slug`로도 공유 문서를 판별한다. 공유 문서는 `slug`가 모델 키와 같다.

1. **사이트 배포**: 사용자 운영 승인 범위에서 클린 워크트리로 배포한다. 배포물에 `/preview/content/:id`, `CONTENT_EDITING_CACHE_TAG` 웹훅 분기, 계약과 runtime receipt가 함께 들어가야 한다. 이 단계에서는 공유 문서가 없어도 코드 기본값이 나온다.
2. **계약 sync**: 기존 운영 계약과 모델을 백업·대조하고 v7을 동기화한다. 기존 글 모델 3개·metadata·팝업·블로그 하단 이미지 패턴을 보존한다. 새 모델·필드 그룹·`presentation.listPaths`도 함께 설치한다. `pages`는 비어 있어야 한다. `patternManagement`를 `code`로 바꾸지 않는다.
3. **production:content-import plan → 승인 → publish**: 플랫폼의 `docs/content-import-production.md`를 따라 초기 manifest의 원문 해시·문서 ID·모델·필드 그룹·대상 사이트를 검토한다. DB에 쓰지 않는 plan 근거를 만든 뒤 별도 승인 범위에서 publish한다. 기존 문서가 있거나 고객 수정값이 있으면 코드 초기값으로 덮어쓰지 말고 변경분만 검토한다. 공유 모델마다 문서는 한 개만 유지한다. `alternateName`은 빈칸 그대로다.
4. **메타데이터 설치 근거 재등록**: v7 계약 checksum으로 기존 metadata 설치 검증을 다시 수행하고 근거를 등록한다. metadata 내용은 바꾸지 않는다.
5. **관리자 확인**: 공통 안내와 블로그·후기·FAQ 목록 아래 안내 위치, 공통 미리보기의 푸터·추가 값 목록과 각 하단 미리보기의 카드 한 장, PC·모바일 레이아웃, 클릭한 값의 입력칸 선택, 항목 목록의 `alternateName`, 숨긴 카드의 미노출을 확인한다. 발행 웹훅 200과 변경 반영을 로컬/폐기 fixture에서 먼저 확인하고 운영 시험은 승인 범위에서만 한다. 공통·세 하단의 값은 서로 독립임을 안내한다.

## 로컬에서 다시 생성·검증

사이트 폴더에서 다음을 실행한다.

```sh
pnpm cms:content:export
pnpm test
pnpm build
```

플랫폼 폴더에서 기본 dry-run만 실행한다. `--local`, 운영 접속값, publish 옵션은 아래 명령에 넣지 않는다.

```sh
pnpm exec tsx tooling/scripts/content-import.ts \
  --manifest <사이트 폴더>/cms/content-import.json \
  --source-root <사이트 폴더> \
  --runtime-receipt <사이트 폴더>/cms/content-runtime-receipt.json \
  --report /tmp/madiclinic-import-check.json
```

receipt를 다시 생성하면 사이트 배포물에도 포함해야 한다. 이 검증은 운영 문서 생성·발행이나 설치 완료의 근거가 아니다.

현재 호스트의 기본 pnpm 12.15.0은 프로젝트 지정 pnpm 10.33.0을 준비할 때 외부 경로 쓰기 제한에 걸렸다. 검증에서는 이미 설치된 pnpm 10.29.2를 일시적인 `/tmp` 실행 경로로 사용하고 자동 버전 설치를 껐다. 프로젝트 packageManager·잠금파일은 바꾸지 않았다. 자동 설치 시도가 의존성 폴더를 바꿔 이를 중단하고 동일 잠금파일의 로컬 캐시만으로 복구했다. `pnpm build` 안의 typecheck도 같은 실행 경로를 사용했다.

## 환경 변수

- `ROOTTALE_API_KEY`: 서버 전용 사이트 읽기 키. 브라우저·로그·manifest에 기록하지 않는다.
- `ROOTTALE_API_BASE`: CMS API 주소.
- `NEXT_PUBLIC_ROOTTALE_SITE_ID`: 조회 대상 사이트 ID.
- `ROOTTALE_VISUAL_EDITOR_ORIGINS`: 추가 허용 관리자 origin, 쉼표 구분. 기본 두 관리자 주소는 코드에서 허용한다.

키 누락·공유 모델 미설치·조회 실패에는 코드 기본값을 사용한다. 별도 콘텐츠 모드 변수는 없다. 편집 범위와 코드 소유 문구는 [편집 범위](cms-edit-scope.md)를 따른다.

## 발행 확인과 미리보기의 적용 범위

- 고정 확인 경로는 `clinic-common`의 `/column` 하나다. 푸터 사업자번호·대표자·직함·주소·전화·팩스·이메일·저작권 8개를 선언하며 전화·팩스는 `phone` 정규화를 쓴다. 공개 값 요소의 텍스트만 저장 값과 비교한다. 하단 문서 3개와 상세 버튼·URL·JSON-LD 전용 칸은 고정 공개 경로가 없어 선언하지 않는다.
- 공개 문서가 없으면 기존 HTML을 유지하고, 발행 문서가 있을 때만 확인 표식을 붙인다. 편집 미리보기에서는 `data-rt-edit`를 쓴다. 라벨과 값이 섞이는 줄은 값 요소를 분리했다.
- `/preview/content/*`만 공개 layout을 제외하고 초안을 직접 그린다. `/preview/post/*`는 공개 layout·이미지 라이트박스와 발행 공유 문서를 사용하는 기존 글 미리보기 동작을 유지한다.
- 공통 문서에는 실제 공개 소비처가 있는 칸만 남긴다. 전화 연결·국가번호는 같은 문서의 표시 번호에서 계산하고, 의사 직함도 대표원장 직함을 읽는다. 문구나 번호가 비어 화면에서 사라지면 편집 미리보기 아래 목록의 `<dd>`에서 다시 입력한다. 빈 값 표시는 `비어 있음`이다.
- 공유 조회는 모델별 성공 결과만 캐시한다. 실패한 모델은 다음 요청에서 다시 읽으며 API 키를 캐시 인자로 넘기지 않는다. 기존 고객값을 코드 기본값으로 캐시하는 동작을 막는다.

로컬 회귀 검증에는 첫 실패 뒤 다음 조회 복구, 세 글 유형의 발행 공유값·layout 유지, 공통 문서 모든 문자열 값의 공개 소비처, 빈칸 재편집과 중복 제거, 플랫폼과 같은 HTML 발행 확인 비교를 포함한다. 로컬 가짜 CMS로 공개 화면의 값 반영·빈 값 숨김·위험 주소 거부와 공유 문서 미리보기를 Aside PC·390px에서 확인했다. 운영 데이터는 쓰지 않았다. 관리자 iframe 안의 클릭 편집은 운영 적용 뒤 확인한다.
