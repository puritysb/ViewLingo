# 매체별 오프라인 집계 리포트

Google Ads, Yahoo Search/Display, Meta, Kakao의 광고 집계와 GA4의 동의 기반
웹 이벤트를 동일한 형식으로 검토하는 **수동 입력·오프라인 도구**입니다.
자동 수집, 계정 연결, 실시간 대시보드 또는 구매 추적 완료를 뜻하지 않습니다.
입력된 증거의 형식은 검증하지만 계정 내 원본의 진위나 누락 여부는 검증하지
않습니다. 웹 라우트 준비, 광고 URL 적용, 광고 집행, 이벤트 수신, 처리된 리포트는
서로 다른 확인 단계입니다.

기존 수집·동의·Apple 집계 제한은 [funnel-measurement.md](funnel-measurement.md)를
참고하세요. 이 도구는 수집기, SDK, 쿠키, 권한, 광고 계정을 변경하지 않습니다.

## 실행

Node.js 내장 모듈만 사용합니다. 네트워크와 외부 패키지는 필요 없습니다.
리포트와 원본은 **이 공개 저장소 밖의 비공개 경로**에 보관하세요.
아래 명령의 경로는 사용자가 준비한 비공개 폴더로 바꾸세요.

```sh
# 등록된 모든 업무 캠페인, 모든 지표를 명시적인 미확인(null) 상태로 생성
node scripts/funnel-report.cjs --template > /private/path/input.json

# 기존 JSON 인터페이스: 배열 출력 유지
node scripts/funnel-report.cjs /private/path/input.json > /private/path/report.json

# 브라우저에서 로컬로 열어 읽는 한국어 요약 + 상세 출처/기간
node scripts/funnel-report.cjs /private/path/input.json --format html > /private/path/report.html

# Excel/Numbers 등에 가져올 긴 형식 CSV
node scripts/funnel-report.cjs /private/path/input.json --format csv > /private/path/report.csv

# 파일 인자를 생략하거나 - 를 쓰면 표준 입력
cat /private/path/input.json | node scripts/funnel-report.cjs - --format=json
```

템플릿은 집행 여부나 실측값을 주장하지 않습니다. 아직 광고에 적용하지 않은 키도
포함하므로 `notes`에 적용 상태와 전환 시각을 기록하세요. 잘못된 입력은 종료 코드 1,
stderr 오류로 실패하며 업무 데이터는 출력하지 않습니다. 셸의 `>`는 실패해도 기존
대상 파일을 먼저 비울 수 있으므로 기존 리포트 보존이 필요하면 새 파일에 생성한 뒤
성공을 확인하세요. 업로드·공개·정기 수집은 수행하지 않습니다.

## 캠페인 연결표

등록 여부는 URL 라우팅 지원을 뜻하며 활성 광고나 수신 확인을 뜻하지 않습니다.
QA 키 `vl_dg_qa_01`, `vl_qa_260913` 및 미등록 키는 업무 입력으로 허용하지 않습니다.

| 캠페인 | 출력 channel | 고정 source / medium |
| --- | --- | --- |
| `vl_google_us_l01` | `google_search` | google / cpc |
| `vl_dg_us_01` | `google_demand_gen` | google / display |
| `vl_google_tw_s01` | `google_search` | google / cpc |
| `vl_google_tw_d01` | `google_demand_gen` | google / display |
| `vl_ly_jp_s01` | `yahoo_search` | yahoo / cpc |
| `vl_ly_jp_d01` | `yahoo_display` | yahoo / display |
| `vl_meta_kr_awareness_20261104` | `meta` | meta / paid_social |
| `vl_kakao_kr_pc_cpm_20261105` | `kakao` | kakao / display |
| `vl_kakao_kr_sq_20261106` | `kakao` | kakao / display |
| `vl_kakao_kr_wide_20261106` | `kakao` | kakao / display |

한 입력에서 캠페인 키당 한 행만 허용합니다. 기간별 비교는 별도 파일을 생성하세요.
Kakao의 새 두 키로 과거 공통 URL의 실적을 나누거나 기존 캠페인 합계를 복제하지
마세요. 광고 관리자상의 캠페인명/숫자 ID와 이 웹 키의 대응, 최종 URL, 적용 시각을
원본 증거에서 확인해야 합니다. 이 도구는 그 대응을 자동 추측하지 않습니다.

## 입력 계약

최상위는 `{"schemaVersion":1,"rows":[...]}` 입니다. 각 행은 `campaign`,
선택적 `notes`, `metrics`를 갖습니다. 누락한 지표는 `not_verified` / `null`로
남습니다. 명시한 지표 객체가 잘못되었거나 지표 이름에 오타가 있으면 거부됩니다.

관측 지표에는 `status:"observed"`, 숫자 `value`, 행과 일치하는 `campaign`,
허용된 `source`, 빈 값이 아닌 `evidence`, `period`가 필요합니다.
`evidence`는 실제 확인한 비공개 원본 파일, 계정 화면 URL 또는 내부 참조입니다.
경로만 적었다고 도구가 파일을 읽거나 원본을 검증하는 것은 아닙니다.

- `period.start`, `period.end`: UTC 또는 명시적 오프셋이 있는 정확한 타임스탬프.
  `[start, end)`로 종료 시각은 제외합니다. 날짜 범위만 표시된 원본은 계정 시간대를
  확인해 경계를 변환하세요. 원본 시간대가 미확인이면 숫자를 수입하지 마세요.
- `period.timezone`: `Asia/Seoul`, `Asia/Tokyo`, `Asia/Taipei`, `UTC` 등 원본의
  유효한 시간대 이름. 미국 광고라는 이유로 미국 시간대를 가정하지 마세요.
- `period.final`: 보고/기여 지연 및 수정 가능성을 확인한 boolean.
  오늘 날짜, 아직 처리 중인 GA4, 미성숙 기여 기간을 임의로 `true`로 두지 마세요.
- 돈 지표는 원본의 대문자 3자리 `currency`가 필요합니다. 환산하지 않습니다.
  광고 비용 `spend`는 음수가 될 수 없습니다. 건수는 음이 아닌 안전한 정수입니다.
- `row.notes`, `metric.note`: 선택적 빈 값이 아닌 문자열, 각 2,000자 이하.
  미집행, URL 미적용, 자료 누락, 전환 시각 등 해석에 필요한 문맥을 보존합니다.
- `metric.observedAt`: 선택적 확인 시각. 오프셋 있는 타임스탬프이며 지표 기간을
  대체하지 않습니다. 미확인 지표에도 note/observedAt을 남길 수 있습니다.

관측하지 못한 값은 `{"status":"not_verified","value":null}` 입니다.
다른 상태는 `not_collected`, `not_yet_available`, `suppressed`입니다.
**미확인, 수집 안 됨, 개인정보 임계값에 따른 숨김은 0이 아닙니다.**
관측값 0은 원본에 실제 0이 확인되었을 때만 입력하세요.

### 허용된 출처

| 지표 | 필요한 source 및 추가 근거 |
| --- | --- |
| Google 노출/클릭/비용 | `google_ads_report` |
| Yahoo 노출/클릭/비용 | `yahoo_report` 또는 해당 채널의 `yahoo_search_report` / `yahoo_display_report` |
| Meta 노출/클릭/비용 | `meta_report` |
| Kakao 노출/클릭/비용 | `kakao_report` |
| GA4 랜딩/스토어 CTA | `ga4_report`, `measurementId:"G-HHSGB68SC4"`, 정확한 `eventName`, `coverage`, `qaExcluded:true` |
| 기존 Yahoo 랜딩/스토어 액션 | 해당 Yahoo 광고 보고서 source. GA4로 재분류하지 않음 |
| Apple 상품 페이지 조회/매출/수익/환불 수익 | 캠페인별 `apple_analytics` |
| Apple 첫/재/총 다운로드 | `apple_downloads` 또는 `apple_analytics` |
| 결제 이용자 | `apple_app_paying_users`, `appId:"6749508592"`, `itemScope:"app_only"` |
| 유료 앱 거래/환불 거래 | `apple_paid_app_transactions` + 아래 `paidAppEvidence` |

GA4 `landing_arrivals`의 `eventName`은 `landing_arrival`, `store_cta_clicks`는
`store_cta_click`입니다. 페이지 조회 수나 Google Ads 방문 전환을 대신 넣지 마세요.
GA4 이벤트 테이블에서 해당 이벤트와 **VL Campaign**으로 구분한 **Event count**를
확인하세요. 기본 Landing page / Views 또는 사용자 수를 이벤트 수로 바꾸지 마세요.

`coverage`는 확인한 집계 범위/필터/동의 조건의 식별자입니다. GA4와 Yahoo는 동의,
집계, 기여 규칙이 다릅니다. 같은 문자열을 적어도 두 체계의 랜딩/CTA 비율은
계산하지 않습니다. Yahoo 기존 입력의 coverage가 없으면 건수는 보존하지만 범위가
필요한 비율은 보류합니다. Yahoo `yahoo_report`를 웹 액션에 쓰는 기존 형식은
지원하며 `measurementSystems`에 `yahoo_ads_attributed_action`으로 구분합니다.

`qaExcluded:true`는 GA4 원본의 테스트 제외를 **실제로 확인했다는 입력자의 확인**입니다.
이벤트 이름, 스트림 ID, DebugView 확인만으로 설정할 수 없습니다. QA 캠페인,
시험 유입 및 알려진 비업무 트래픽이 포함되지 않도록 필터와 적용 범위를 확인하고
`evidence`/`note`에 근거를 남기세요. 구분할 수 없는 혼합 집계는 미확인으로 남깁니다.
도구는 원본 필터를 읽거나 미표시 시험 트래픽을 알아내지 못합니다.

입력/행/지표의 `qa`, `isQA`, `test`, `isTest`, `synthetic`, `testTraffic`,
`testMode`가 true이거나 `measurement_qa`가 true/1/"1"이면 전체 입력을 거부합니다.
`campaign`, `source`, `medium`, `content`, `environment`, `trafficType`, `label`,
`labels`에 분리된 QA/test/debug/synthetic/staging 등 시험 표식이 있는 경우도 거부합니다.
`labels`는 문자열 또는 문자열 배열입니다. `notes`와 증거 파일명은 트래픽 표식이
아니므로 자동 분류하지 않습니다. 시험 흔적을 삭제해서 운영 데이터로 바꾸지 마세요.

### Apple 구매 증거

`paidAppEvidence`는 `appId:"6749508592"`, `itemType:"paid_app"`,
`positiveCustomerPrice:true`, `excludesRedownloadsAndFreeUnits:true`,
`refundsSeparate:true`를 포함해야 합니다. 이것도 원본을 확인했다는 확인이지
구매를 생성하거나 추정하는 기능이 아닙니다. 앱 전체 거래를 캠페인에 배분하거나
다운로드, 고유 결제 이용자, 매출/수익을 거래 수로 변환하지 않습니다.

## 비율과 출력 해석

JSON은 기존 캠페인 결과 **배열** 형태와 주요 필드를 유지하며 측정 체계와 notes를
추가합니다. 잘못된 출처(예: Yahoo 광고 보고서로 Apple 다운로드를 주장)처럼
기존에 느슨하게 허용됐던 입력은 더 이상 통과하지 않습니다.

- 비율은 양쪽이 관측되었고, 절대 시작/종료 시각과 시간대 문자열이 같고,
  기간이 final이며, 분모가 양수일 때만 계산합니다.
- 경계가 같아도 시간대가 다르면 `different_timezones`로 보류합니다.
  단순히 이름을 맞춰 계산을 열지 마세요. 실제 원본 집계 기준을 확인해야 합니다.
- 수익/비용 비율은 통화도 같아야 합니다. 거래당/이용자당 비용은 비용의 원통화를
  붙입니다. 환율, 합계, 매체별 기여 재배분은 생성하지 않습니다.
- CTA/랜딩 및 Apple 조회/CTA는 확인된 coverage가 같아야 하며 GA4와 다른
  측정 체계의 조합은 `different_measurement_systems`로 보류합니다.
- 랜딩/광고 클릭은 동의 누락이 있는 기간 집계 비교입니다. 모든 방문자의 도착률,
  같은 이용자의 전환율이나 이탈률로 해석하지 마세요. 비율이 1을 넘을 수도 있습니다.
- CSV의 `metric` 행은 값·출처·기간·통화·메모를 보존합니다. `ratio` 행은 분자/분모
  지표명과 값 또는 보류 사유를 갖습니다. 비율 자체에 별도 기간을 만들어 넣지
  않으며 같은 캠페인의 두 metric 행을 확인하세요. null은 빈 셀 + 명시적 상태입니다.
- HTML은 오프라인 한국어 요약과 상세 표를 제공합니다. 요약 셀끼리 기간이 다를 수
  있으므로 상세 기간/출처를 먼저 확인하세요. 미확인을 숨기지 않습니다.
- CSV는 수식 시작 문자가 있는 텍스트에 작은따옴표를 붙이고 모든 필드를 인용합니다.
  HTML은 사용자 텍스트를 이스케이프하며 스크립트/외부 자산/링크 탐색을 만들지 않습니다.
  두 출력 모두 비공개 근거와 메모를 포함할 수 있으므로 공개 저장소에 추가하지 마세요.

## 형식 예시: 전부 합성 데이터, 실제 성과 아님

다음은 한 지표의 계약을 보여 주는 **합성 예시**입니다. 운영 원본이나 수신 증거가
아니며 실제 리포트에 복사하지 마세요. 테스트 파일의 숫자/날짜/근거도 모두 합성입니다.
도구 자체는 거짓 확인과 진짜 확인을 판별할 수 없습니다.

```json
{
  "schemaVersion": 1,
  "rows": [{
    "campaign": "vl_google_tw_s01",
    "notes": "형식 설명용 합성 예시. 실제 광고 실적이 아닙니다.",
    "metrics": {
      "landing_arrivals": {
        "status": "observed",
        "value": 8,
        "campaign": "vl_google_tw_s01",
        "source": "ga4_report",
        "measurementId": "G-HHSGB68SC4",
        "eventName": "landing_arrival",
        "coverage": "example_analytics_consent_public_entries",
        "qaExcluded": true,
        "evidence": "SYNTHETIC EXAMPLE ONLY, not an account export",
        "observedAt": "2026-01-04T00:00:00Z",
        "period": {
          "start": "2026-01-01T00:00:00+08:00",
          "end": "2026-01-02T00:00:00+08:00",
          "timezone": "Asia/Taipei",
          "final": true
        }
      }
    }
  }]
}
```

## 검증

```sh
node --test tests/funnel-report.test.cjs
node --test tests/*.test.cjs
git diff --check
```

테스트는 네 Google 키, 기존/신규 Kakao 키, 실제 URL 레지스트리의 source/medium,
출처/GA4 필터 계약, QA 제외, 시간대/기간/통화 차이, 미확인 표시, Apple 구매 오인 방지,
CSV/HTML 이스케이프, 메모 보존, CLI 및 null 템플릿을 확인합니다.
이 통과 결과는 광고 계정, GA4 실제 수신 또는 Apple 구매의 검증 결과가 아닙니다.
