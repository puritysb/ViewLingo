# Campaign funnel reconciliation

This site preserves campaign links and sends optional, consented Store-click events. It cannot inspect a customer's Apple purchase, and a Store click is never a purchase. This procedure compares campaign aggregates; it does not identify or follow individual people.

## Published Meta and Kakao URL compatibility

Two exact public UTM combinations now resolve to canonical website campaign names:

| Source | Medium | UTM campaign / Apple `ct` | Content |
| --- | --- | --- | --- |
| `meta` | `paid_social` | `vl_meta_kr_awareness_20261104` | `screen_translation_a` |
| `kakao` | `display` | `vl_kakao_kr_pc_cpm_20261105` | `icon_a` |

All four UTM values must match once each. A conflicting, empty or duplicate explicit `campaign` is not rescued by UTM matching. Internal pages, language switches and the dynamically created consent-policy link carry only the canonical `campaign`; Store links carry only the fixed app/provider/media type and that `ct`. Incoming click identifiers, user input and arbitrary UTMs are not copied to those links. Existing Google/Yahoo routing remains separate. No advertising account URL edit or domain migration is required for these two already published links.

Both names fit Apple's 30-character syntax. The existing provider token `128040795` was previously generated and verified for this app; Apple's documentation permits reusing it while changing `ct`. This is website routing and format validation, **not** confirmation that Apple has shown a campaign row, received a paid customer or validated a new campaign in an authenticated session. That evidence still requires an available campaign report and its privacy thresholds. No authenticated Apple session or purchase was used to implement this change.

This change adds no Meta or Kakao SDK, pixel, recipient, purpose grant, customer ID, storage, server collector or purchase event. Existing consented Google visit/Store commands retain a canonical campaign in their configured `page_location` for the exact UTM routes. This metadata is **not a verified channel-by-channel reporting dataset**: current Google Ads action reporting has not been shown to expose those URL values as a usable cross-channel breakdown. The Yahoo-only `viewlingo:funnel` contract and Yahoo SDK remain inactive for Meta/Kakao traffic. The separate GA4 implementation below now prepares those aggregates, while actual receiver acceptance and campaign data remain to be verified. Platform ad impressions/clicks/spend and future Apple campaign data must remain separate from this unverified middle section.

The offline report accepts the two canonical names and labels their channels. Ad impressions/clicks/spend need matching `meta_report` or `kakao_report` sources; this does not fetch reports or prove their authenticity. Unavailable landing/CTA/Apple metrics stay null. A later implementation of per-channel website aggregates would need a concrete collector/event/reporting design, verified owned tracking assets, recipient/purpose and automatic-collection review, updated consent where needed, separate deployment approval and receiver acceptance. Neither Google URL metadata nor a DOM CustomEvent is a replacement for that work.

GitHub Pages can serve these static routes and scripts. The loss was caused by URL matching, not static hosting. Moving to another domain would not add an event collector, overcome Apple's privacy thresholds or prove purchases; it would add new redirects and attribution/cookie boundaries. Keep the current domain for this compatibility fix.

Official Apple rules: [campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/). Do not forward Apple aggregate purchases as individual vendor purchase conversions or treat ad attribution as incremental causal lift.

## Prepared Taiwan Search route

`https://puritysb.github.io/ViewLingo/zh-hant/?campaign=vl_google_tw_s01&utm_source=google&utm_medium=cpc&utm_campaign=vl_google_tw_s01&utm_content=screen_text_a` is a prepared public route, not proof of a saved, published or active ad. The exact UTM tuple and the canonical campaign are allowlisted; partial, conflicting, duplicate and unknown metadata are rejected. FAQ, privacy, language navigation and Store links preserve the canonical campaign without forwarding click IDs. The fixed Apple app/provider remain unchanged; `ct=vl_google_tw_s01` fits Apple's syntax but receipt and paid-customer campaign reporting remain unverified. Existing Google consented visit/Store events, refusals, GPC/DNT and Yahoo campaign boundaries remain unchanged. This route adds no collector, pixel, recipient or purpose and does not establish a new channel-level web report.

## Separate consented GA4 website analytics

The owned `ViewLingo Website` GA4 property and web stream use `G-HHSGB68SC4`. A separate Analytics banner, with five localized notices and footer settings, governs this purpose. Existing Ads/Yahoo grants never grant Analytics. One shared Google queue/loader applies independent `ad_storage` and `analytics_storage` states, configures only allowed destinations and keeps advertising personalization denied. Neither loader nor denied-state pings are sent when both purposes are refused/unanswered or GPC/DNT applies. Ads-only consent does not configure this GA4 stream; Analytics-only consent does not configure Ads or Yahoo. Each purpose can be withdrawn separately; withdrawal disables/unloads its tracking with a reload while retaining the other saved choice. The choice and prefixed Analytics cookies last up to 60 days; cookie expiry is not refreshed each visit.

Verified property settings: event/user retention 2 months, activity-based retention reset off, enhanced measurement off, detailed location/device collection off, Google Signals and user-provided data not enabled, advertising personalization blocked in all regions. No User-ID, customer matching, Ads link, audience activation, API secret or OAuth is added. Some necessary GA4 SDK events such as session/first-visit/engagement can still occur; this is not a promise of exactly two network events. Retention settings do not erase all aggregate reports after two months.

The two explicit, zero-value events are `landing_arrival` (once per consented public entry document with an external or absent referrer) and `store_cta_click` (first eligible App Store CTA per document). Internal same-origin navigation is not another arrival. Reloads and referrer loss can overcount entries; delayed consent, refusal and blocking omit activity. All allowlisted public page paths can be entry pages; the Yahoo landing definition remains homepage-only. Event counts, GA4 SDK users/sessions and Apple paying customers are distinct quantities.

Standard `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content` are configured from fixed registered metadata, including canonical internal links. No arbitrary query, referrer, click identifier or input is copied into Analytics events. Unknown source is explicitly `unattributed`; do not call it verified direct traffic. Six event-scoped custom dimensions are configured:

| Display name | Parameter | Meaning |
| --- | --- | --- |
| VL Source | `vl_source` | Fixed public source |
| VL Medium | `vl_medium` | Fixed public medium |
| VL Campaign | `vl_campaign` | Canonical registered campaign, or `web` |
| VL Content | `vl_content` | Fixed public content variant, or `none` |
| VL Page Path | `vl_page_path` | Allowlisted current path; `index.html` normalized to its directory; no query/hash |
| VL CTA Location | `vl_cta_location` | `hero`, `proof`, `purchase`, `navigation`, `footer`, `body`; `none` for arrival |

Do not use GA4's default Landing page / Views report as proof of this custom funnel: automatic `page_view` is disabled. Use the named entry event and its VL Page Path; a Store event's path is the CTA's current page, not necessarily the original entry page. No original-entry identifier is stored or passed to Apple. To inspect a cross-page funnel, use a closed exploration with step 1 `landing_arrival` plus fixed VL Campaign/entry-path conditions and step 2 `store_cta_click` plus the same fixed campaign and optional CTA slot. Explicitly document elapsed-time and user/session scope. A user-based funnel is not an event-count ratio or evidence of individual purchases.

First compare an Events/Exploration table by Event name + VL Campaign + VL Page Path + VL CTA Location, with Event count, then separately inspect standard source/medium/campaign acquisition. Custom-definition processing and report availability may lag. Configuration, offline queue tests, deployment, browser transmission, Analytics receipt and processed reporting are separate verification stages. Never fill a missing receiver/report cell with zero. Keep daily ad impressions/clicks/cost in the original platform currency and a private bounded-period ledger; no automatic cost importer or new credential is required. Apple purchase evidence remains a separate aggregate source.

QA mode (`measurement_qa=1` or loopback hostname) runs the consent/interaction path without any provider loader or command. QA output is not proof of GA4 receipt. No real ad click or purchase is needed for a later separately reviewed nonpurchase reception test; DebugView alone does not guarantee exclusion from production reports. Record filters/test identity and possible mixture before such a test.

## Current collection boundaries

| Stage | Evidence source | Meaning and limits |
| --- | --- | --- |
| Ad impressions / clicks / spend | Yahoo campaign report | Delivered ad activity, not a loaded landing page. |
| Landing arrival | Separate Yahoo secondary landing action | After a separate visit-purpose grant, eligible campaign home entries send a zero-value event. Natural receipt must be confirmed; this is not an all-visitor census. |
| Store CTA | Existing consented Yahoo secondary action | Attempted outbound movement, value zero; not proof the Apple page loaded. Keep excluded from bidding and primary conversions. |
| Apple product-page views | Apple Analytics, Campaign filter | Apple views; separate from impressions. Subject to reporting dates and privacy thresholds. |
| First-time / repeat / total downloads | Apple download metrics | Total downloads = first-time downloads + redownloads. Neither implies a new paid sale. |
| App paying users | Apple Sales metrics, App Purchases + Campaign filters | Apple Accounts that paid for the app. A unique paying-user count is not a transaction count. Do not sum daily unique users to invent a period-unique count. Exclude In-App Purchases from this view. |
| Paid app transactions / refunds | An Apple report that actually provides paid-app transaction evidence at campaign scope | Require the app item, positive customer price, paid-unit definition and separate refund handling. If this breakdown is unavailable, leave the transaction count unverified. Do not distribute app-wide Sales and Trends totals across campaigns. |
| Sales / proceeds / refunds | Apple campaign-filtered monetization metrics | Sales and estimated proceeds differ; proceeds are after applicable taxes and commission. These estimates are not final bank settlement. |

The older Google `visit` conversion runs after consent once per loaded document, including internal pages. `send_page_view` is false. It is not an independent count of Yahoo first landing arrivals. Google Ads' paid-channel attribution also differs from Yahoo's. Do not reuse its label for a new Yahoo event or count every internal page as a new landing.

## Local entry instrumentation

`measurement.js` dispatches `viewlingo:funnel` with only `event`, canonical allowlisted `campaign`, `value: 0` and `scope: consented_document`:

- `landing_arrival`: once per entry document after both existing measurement consent and a separate Yahoo visit-purpose grant, on a homepage with a registered Yahoo campaign and no same-origin referrer. Internal FAQ/privacy/guide navigation is excluded. Reloads or privacy-stripped referrers can still count as new documents; this is not a person or session count.
- `store_cta_click`: the existing once-per-document Store-click boundary, including when reached through internal pages. It is not paired to a person-level landing session.

The landing event is connected to two separately named Yahoo secondary actions: Search tracker `3061625` (Page access) and Display tracker `1869339` (Browsing main pages). Both use value zero, one per ad click, and exclusion from optimization/primary conversions. Their public labels are separate from the unchanged Store labels. The same existing Yahoo loader is reused; no new service, credential, fingerprint, customer identifier or additional cookie/localStorage attribution copy is added. The SDK can receive campaign/ad identifiers and browser/network information described in the notice.

Existing `viewlingo_ad_measurement_v2` consent still governs its original Google and Yahoo Store purposes. It never grants visits. A second, explicit choice uses `viewlingo_yahoo_landing_v1`, storing only choice and expiry for 180 days. The additional prompt appears after the existing measurement is allowed, on a registered Yahoo campaign. Declining visits does not revoke Store permission. Footer settings allow the visit choice to be changed; withdrawal removes queued landing commands without removing authorized Store commands. A global refusal, unanswered global consent or GPC/DNT prevents landing events even with a saved visit grant. Full withdrawal unloads tags as before. Do not treat an expired or old Store grant as new-purpose consent.

QA emits local diagnostic events and neither loads providers nor queues external commands. It cannot establish server receipt. Do not click a paid ad or generate fake conversions to test. Check the named landing and Store actions after natural eligible traffic, and distinguish a created/connected action from its last receipt and attributed count. Because one-per-click attribution and consent/referrer restrictions differ from raw browser documents, these counts are not unique visitors or a joined session funnel.

## Apple campaign connection

Registered Search and Display links use `pt=128040795`, `ct=vl_ly_jp_s01` or `ct=vl_ly_jp_d01`, and `mt=12` for this Mac app. The provider token identifies the developer account, not Yahoo. The legacy Display name maps to the short Display token. The app ID and destination are fixed, internal/locale links preserve the campaign, and arbitrary parameters are not forwarded to Apple. Missing/unknown campaigns or JavaScript disabled fall back to the static `web` label. The link operation is not itself an analytics event.

Apple's current rules include a 24-hour first-download attribution window after using the campaign link, credit to the most recent campaign link, a minimum of 24 hours before a campaign appears, and minimum privacy thresholds (including five individual first-time downloaders for campaign appearance). Each metric also needs its display threshold. Detailed reports may suppress or combine small rows. Missing rows are not zero, and API access does not remove these restrictions. Current displayed date availability takes precedence over an assumed real-time feed.

Sources: [campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/), [metric definitions](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions/), [filters and dimensions](https://developer.apple.com/help/app-store-connect-analytics/reference/filters-and-dimensions/), [Analytics overview](https://developer.apple.com/app-store-connect/analytics/). Recheck current definitions before reporting.

## Read-only reporting procedure

1. Record observation time, app ID, campaign token, source, exact report period, timezone, source URL/export and whether the period is final. Keep private account exports outside this public repository.
2. Read Yahoo impressions, clicks and spend per campaign. Read **all conversions / the named Store secondary action** separately; a primary Conversions value of zero does not prove zero Store clicks when the action is excluded. Distinguish configuration, last received event and attributed conversion count.
3. Use only actual receiver counts for landing arrivals. Until natural receiver receipt and an attributed count are confirmed, enter `not_verified`, never zero. Label consented document events separately from visitors and ad clicks.
4. In App Store Connect choose this app → Analytics → Sales → Metrics. Select **App Purchases**, **Paying Users**, then **Campaign**. Select the exact `ct` when it becomes available. Record the source and definition alongside the count. Also inspect campaign Sales, Proceeds and refunds. A positive app-only campaign paying-user count is evidence of paying customers; it is not an exact count of transactions. If campaign-level paid-app transaction evidence is absent, retain an unknown transaction count.
5. Read campaign product-page views, first-time downloads and redownloads separately. The Campaigns summary's Impressions column is not product-page views. Never convert total downloads into paid purchases or divide proceeds by the current regional list price to infer units. Promotions, Family Sharing, refunds and currency/tax/commission differences can invalidate that inference.
6. Apple uses UTC days. Do not align a Yahoo date using a UTC+9 boundary with the same textual Apple date. Use matching absolute period boundaries where the source can supply them; otherwise report side by side and withhold cross-period ratios. Allow the source's reporting/attribution window to mature and record later corrections. Do not silently match different dates to fill gaps.
7. Check app-wide Sales and Trends and final financial reports as independent reconciliation. They do not establish which ad acquired a buyer. Keep purchase counts, unique buyers, refunds, gross sales and proceeds distinct. Do not upload Apple aggregates to Yahoo as individual purchase conversions.

## Offline report tool

`node scripts/funnel-report.cjs /path/to/private-input.json` reads aggregate JSON and prints JSON. It performs no network requests. It validates an input record, not the authenticity of an Apple export; the operator must retain and inspect source evidence.

Input shape: `{"schemaVersion":1,"rows":[{"campaign":"vl_ly_jp_s01","metrics":{...}}]}`. Supply each metric as:

```json
{
  "status": "observed",
  "value": 1,
  "campaign": "vl_ly_jp_s01",
  "source": "yahoo_report",
  "evidence": "private source export reference",
  "period": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-01-02T00:00:00Z",
    "timezone": "UTC",
    "final": true
  }
}
```

These dates and numbers illustrate the format, not actual results. Unavailable values use `{"status":"not_collected","value":null}`; other statuses are `not_verified`, `not_yet_available` and `suppressed`. Omitted metrics remain unverified. Money needs an ISO currency. The script never performs automatic FX conversion.

An observed `paying_users` metric requires `source: apple_app_paying_users`, `appId: "6749508592"` and `itemScope: app_only`. An observed `paid_app_purchases` metric requires `source: apple_paid_app_transactions` plus `paidAppEvidence` containing `appId: "6749508592"`, `itemType: paid_app`, `positiveCustomerPrice: true`, `excludesRedownloadsAndFreeUnits: true`, and `refundsSeparate: true`. These are attestations to checked source evidence, not a way to turn downloads into purchases.

Ratios are withheld for unavailable data, non-final or non-matching absolute periods, zero denominators and incompatible currencies. Store-per-landing and Apple-view-per-Store ratios additionally require matching, source-verified `coverage` values. The current Yahoo landing action requires additional visit consent, while the existing Store action covers its original consent population: these are different populations. Keep the totals side by side; do not divide them into a conversion rate. Do not invent a matching coverage value to enable the calculation. Observed landings per all ad clicks is a limited-coverage aggregate, not the complete arrival rate. Other cross-stage ratios remain aggregate period comparisons, not a joined cohort or proof of individual drop-off. A Store click can precede a purchase outside the period. Paying-user and transaction cost metrics are labelled separately.

## Deployment and acceptance

Two dedicated Yahoo landing actions are configured; no new collection service, paid-app event or credential is added. Before publishing script changes, update the script cache revision in each referencing page and run `node --test tests/*.test.cjs` and `git diff --check`. Public code/docs must not include private campaign metrics or exports. After deployment, compare public bytes and inspect with QA only; do not generate real provider events. Report deployment success separately from natural receiver confirmation and Apple campaign paid-customer evidence.
