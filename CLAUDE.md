# Subscription Analytics for Claude Code

For an owner or finance lead reviewing monthly subscription revenue. This is an evidence and review tool; it never bills customers or sends messages.

## One route per job

| Command | Job |
|---|---|
| /customers | Read customer owners and review dates |
| /monthly-review | Review monthly MRR and annualised run rate |
| /movements | Explain adjacent monthly revenue movements |
| /churn-review | Find explicit churn and contraction |
| /expansion-review | Review expansion, activation and returning customers |
| /concentration | Rank latest revenue concentration |
| /segments | Compare observed revenue by business segment |
| /retention | Calculate retention for comparable customer pairs |
| /cohorts | Track groups from their first observed positive month |
| /data-gaps | Find missing months and currency changes |
| /owner-workload | Compare open and overdue review actions |
| /actions | Read revenue follow-up actions |
| /attention | Find overdue work and stale accuracy reviews |
| /history | Read attributed changes |
| /imports | Read imported source-file evidence |
| /compliance | Check accuracy, retention and purpose records |
| /show | Read a customer or action with history |
| /add | Add a customer or assigned follow-up action |
| /update | Update customer ownership and review records |
| /log | Record an attributed customer note |
| /close-action | Close a follow-up with evidence |
| /import | Rehearse and import the ChartMogul monthly customer export |
| /export | Export every record and audit entry |
| /reconcile | Compare the observed monthly total with supplied source evidence |
| /signoffs | Find reconciliations invalidated by later corrections |
| /weekly-review | Draft the weekly revenue review |
| /draft-revenue-pack | Draft the monthly revenue evidence pack |
| /draft-customer-review | Draft one customer revenue review |
| /help | Read command syntax |
| /customise | Change fields and rules with a tested migration |
| /new-view | Add a branded read-only report |

## Operating rules

Run npm run revenue -- help for syntax. Read records before edits. Every write needs the operator's --actor label. Do not invent notes, amounts, dates, source totals or approvals. Resolve ambiguous names using the returned ID list. Keep currencies separate. A missing month is unknown, never churn. First observed revenue is not an acquisition date. Reconcile the source file and inspect data-gaps before circulating a pack. Stale signoffs require a fresh reconciliation.

Drafts stay in drafts/. No sends, payments or automatic deletions. A retention-review finding asks a human to decide what to keep. Read docs/compliance.md and docs/metrics.md before interpreting a result. The database is the record of truth, and an actor label is not authentication.

For real work use an empty DATA_DIR, run npm run migrate, then import. Never load demo data into real customer records. The CLI is scripts/revenue.mjs; schema changes are versioned in supabase/migrations. All recurring jobs have a .claude/commands recipe. Use /customise and /new-view to make changes with tests.

Omni by Enterprise DNA installs, customises and operates your version for one setup fee then a retainer.
