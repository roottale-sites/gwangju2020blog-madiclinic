# headnerve 최근 글 복사

2026-09-22 사용자가 최근 3개 글의 복사와 마디클리닉 공개를 승인했다.

- headnerve는 공개 API와 이미지 조회에만 사용했다. 원본 3개 응답을 복사 전후 SHA-256으로 대조해 모두 일치함을 확인했다.
- 마디클리닉의 `column` 모델, `headache`(두통) 분류에 새 글과 독립 이미지 사본을 생성했다.
- 작성자는 `headnerve (원문)`으로 등록했다. 목록·상세·본문에 원문 출처를 표시하고 구조화 데이터에는 `isBasedOn`을 사용한다.
- 원본 관계 글·작성자 ID·운영 메타데이터는 이식하지 않았다.

## 공개 경로

- `/column/headache/persistent-right-templeheadache`
- `/column/headache/migraine-prevention-pregnancy`
- `/column/headache/criteria-for-investigatingrecurrentrighttempleheadache`

## 확인

- 세 글의 공개 API와 상세 페이지, 목록, RSS, 칼럼 사이트맵 HTTP 200.
- 출처 표시와 목록 데이터 변환 관련 테스트 48개 및 타입 검사 통과.
- 복사용 임시 쓰기 키를 폐기하고 인증 실패(401)를 확인한 뒤 로컬 키 파일도 삭제했다.
- Vercel 운영 배포 완료. 새 글 발행 웹훅의 성공 전달 확인.
- 작성자 생성 알림은 `/blog/author/…` 경로로 전달되어 이 사이트의 지원 경로 검사에서 422로 거절됐다. 실제 글 발행 알림과는 별개이며 작성자 아카이브는 이 사이트가 제공하지 않는다.

원본 응답·이미지·복사 ID 매핑은 `~/workspace/data/gwangju2020blog-madiclinic/2026-09-22-headnerve-copy/`에 보관한다.
