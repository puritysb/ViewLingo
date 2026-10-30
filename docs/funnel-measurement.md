# Campaign funnel reconciliation

This site preserves campaign links and sends optional, consented Store-click events. It cannot inspect a customer's Apple purchase, and a Store click is never a purchase. This procedure compares campaign aggregates; it does not identify or follow individual people.

## Current collection boundaries

| Stage | Evidence source | Meaning and limits |
| --- | --- | --- |
| Ad impressions / clicks / spend | Yahoo campaign report | Delivered ad activity, not a loaded landing page. |
| Landing arrival | No aggregate receiver configured | The local `viewlingo:funnel` event contract is prepared. It does not create a collected metric by itself. |
| Store CTA | Existing consented Yahoo secondary action | Attempted outbound movement, value zero; not proof the Apple page loaded. Keep excluded from bidding and primary conversions. |
| Apple product-page views | Apple Analytics, Campaign filter | Apple views; separate from impressions. Subject to reporting dates and privacy thresholds. |
| First-time / repeat / total downloads | Apple download metrics | Total downloads = first-time downloads + redownloads. Neither implies a new paid sale. |
| App paying users | Apple Sales metrics, App Purchases + Campaign filters | Apple Accounts that paid for the app. A unique paying-user count is not a transaction count. Exclude In-App Purchases from this view. |
| Paid app transactions / refunds | An Apple report that actually provides paid-app transaction evidence at campaign scope | Require the app item, positive customer price, paid-unit definition and separate refund handling. If this breakdown is unavailable, leave the transaction count unverified. Do not distribute app-wide Sales and Trends totals across campaigns. |
| Sales / proceeds / refunds | Apple campaign-filtered monetization metrics | Sales and estimated proceeds differ; proceeds are after applicable taxes and commission. These estimates are not final bank settlement. |

The older Google `visit` conversion runs after consent once per loaded document, including internal pages. `send_page_view` is false. It is not an independent count of Yahoo first landing arrivals. Google Ads' paid-channel attribution also differs from Yahoo's. Do not reuse its label for a new Yahoo event or count every internal page as a new landing.

## Local entry instrumentation

`measurement.js` dispatches `viewlingo:funnel` with only `event`, canonical allowlisted `campaign`, `value: 0` and `scope: consented_document`:

- `landing_arrival`: once per entry document after consent, on a homepage with a registered Yahoo campaign and no same-origin referrer. Internal FAQ/privacy/guide navigation is excluded. Reloads or privacy-stripped referrers can still count as new documents; this is not a person or session count.
- `store_cta_click`: the existing once-per-document Store-click boundary, including when reached through internal pages. It is not paired to a person-level landing session.

There is **no listener that stores or sends these new events**. No new Yahoo conversion ID, endpoint, cookie, localStorage identifier, fingerprint or service is added. The existing Google/Yahoo scripts retain their existing consent boundary. Unanswered consent, refusal, withdrawal, GPC/DNT and unsafe URLs suppress these events. They contain no URL, click ID, referrer, text input or customer identifier. QA dispatches only local events and loads neither provider.

Before calling landing arrivals a collected metric, choose an approved receiver. A new Yahoo secondary landing action would need its real ID and purpose-specific visitor consent wording; existing consent to Yahoo **Store clicks** does not authorize silently expanding to Yahoo visits. A separate collector needs its own approval and privacy review. Neither is configured here. Do not fabricate an ID or reuse the Store action. Natural consented receipt must be checked without clicking a paid ad or generating fake conversions.

## Apple campaign connection

Registered Search and Display links use `pt=128040795`, `ct=vl_ly_jp_s01` or `ct=vl_ly_jp_d01`, and `mt=12` for this Mac app. The provider token identifies the developer account, not Yahoo. The legacy Display name maps to the short Display token. The app ID and destination are fixed, internal/locale links preserve the campaign, and arbitrary parameters are not forwarded to Apple. Missing/unknown campaigns or JavaScript disabled fall back to the static `web` label. The link operation is not itself an analytics event.

Apple's current rules include a 24-hour first-download attribution window after using the campaign link, credit to the most recent campaign link, a minimum of 24 hours before a campaign appears, and minimum privacy thresholds (including five individual first-time downloaders for campaign appearance). Each metric also needs its display threshold. Detailed reports may suppress or combine small rows. Missing rows are not zero, and API access does not remove these restrictions. Current displayed date availability takes precedence over an assumed real-time feed.

Sources: [campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/), [metric definitions](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions/), [filters and dimensions](https://developer.apple.com/help/app-store-connect-analytics/reference/filters-and-dimensions/), [Analytics overview](https://developer.apple.com/app-store-connect/analytics/). Recheck current definitions before reporting.

## Read-only reporting procedure

1. Record observation time, app ID, campaign token, source, exact report period, timezone, source URL/export and whether the period is final. Keep private account exports outside this public repository.
2. Read Yahoo impressions, clicks and spend per campaign. Read **all conversions / the named Store secondary action** separately; a primary Conversions value of zero does not prove zero Store clicks when the action is excluded. Distinguish configuration, last received event and attributed conversion count.
3. Use only actual receiver counts for landing arrivals. Until a receiver is configured and natural receipt is confirmed, enter `not_collected` or `not_verified`, never zero. Label consented document events separately from visitors and ad clicks.
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

Ratios are withheld for unavailable data, non-final or non-matching absolute periods, zero denominators and incompatible currencies. Cross-stage ratios remain aggregate period comparisons with different collection/attribution scopes, not a joined cohort or proof of individual drop-off. A Store click can precede a purchase outside the period. Paying-user and transaction cost metrics are labelled separately.

## Deployment and acceptance

No new collection service, paid app event, platform action or credential is part of this patch. Before publishing script changes, update the script cache revision in each referencing page and run `node --test tests/*.test.cjs` and `git diff --check`. Public code/docs must not include private campaign metrics or exports. After deployment, compare public bytes and inspect with QA only; do not generate real provider events. Report deployment success separately from natural receiver confirmation and Apple campaign paid-customer evidence.
