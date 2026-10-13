# Metric definitions

The import accepts ChartMogul's MRR per Customer per Month CSV with customer_uuid, customer_name, optional company_name and YYYY-MM-DD month-end columns. Values are already calculated MRR in the account's primary currency. Supply that currency explicitly. Only completed months are accepted.

- MRR: sum of observed customer values for that month and currency. Coverage can change; inspect data-gaps.
- ARR run rate: observed MRR multiplied by twelve. Not recognised revenue or a prediction.
- Movement: current less prior MRR, only with both adjacent calendar month observations and the same currency.
- Expansion and contraction: positive opening MRR which increases or decreases but remains positive.
- Churn: a positive observation followed by an explicit zero. Missing customers and blank cells do not count as churn.
- Activation: observed zero followed by positive MRR with no earlier positive history in that currency. It is not proof of new business.
- Reactivation: observed zero followed by positive MRR with earlier positive history in that currency.
- Net retention: closing MRR of comparable opening-positive customers divided by their opening MRR. Gross retention caps each customer's closing amount at their opening amount. Both are null when opening MRR is zero. Missing pairs and currency changes are excluded, so these are paired-customer measures, not a claim of full-portfolio retention.
- Observed cohort: first positive recorded month for a customer and currency. Truncated exports are not acquisition history.
- Concentration: each active customer's share of the latest observed total in its currency. No conversion or mixed-currency totals.

The latest global month is used for movement, concentration and segment summaries. If one currency is stale it will be absent from these summaries; monthly-review shows its last observation. Reconciliation compares the sum exactly to a human-supplied source total. It does not certify that a source file contains every customer or that billing calculations are correct. A fingerprint includes the observed customer IDs and amounts. Corrections invalidate the signoff; history is retained. Never use the report as a revenue-recognition or tax ledger.
