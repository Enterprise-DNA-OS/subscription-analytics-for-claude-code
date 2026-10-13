<h1 align="center">Subscription Analytics for Claude Code</h1>

<p align="center">
  <strong>The open-source subscription analytics system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your ChartMogul data brought across.<br/><a href="https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=chartmogul">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/chartmogul?utm_source=github&utm_medium=readme&utm_campaign=chartmogul">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-chartmogul">Instead of ChartMogul</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Subscription Analytics for Claude Code covers the monthly subscription review work in ChartMogul, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it answers questions across your revenue history and your own review records. ChartMogul also supports configurable analysis; this is not a claim that its reports cannot do equivalent calculations.

[ChartMogul Enterprise starts at US$19,900 per year](https://chartmogul.com/pricing/), checked 13 October 2026. This is a published starting price, not a verified customer invoice or a typical NZ/AU bill.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=chartmogul).

For subscription business owners and finance leads: import monthly customer MRR, review contraction and concentration, assign follow-ups and reconcile month-end totals. This base imports already calculated MRR; it does not replace billing, tax, revenue recognition, processor connections or ChartMogul's invoice normalisation engine. No payment is collected.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

No database server install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/subscription-analytics-for-claude-code.git
cd subscription-analytics-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type a slash command. Start with `/monthly-review`, then `/data-gaps` and `/attention`.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

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

## Instead of chartmogul

Export **MRR per Customer per Month** from ChartMogul Settings > Exports. Run `npm run revenue -- import chartmogul --file=export.csv --currency=NZD --actor="Your name" --dry-run`, review the counts and repeat without `--dry-run`. [Switching guide](docs/replace-chartmogul.md). Use your actual account currency. The plan and quantity variants are rejected.

## Architecture

```
subscription-analytics-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Subscription Analytics for Claude Code for your business, migrates your ChartMogul data, connects it to the rest of your tools, and runs it for you as part of **Omni by Enterprise DNA**, our managed Command Centre. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=chartmogul)
- Read more: [enterprisedna.co/omni/instead-of/chartmogul](https://enterprisedna.co/omni/instead-of/chartmogul?utm_source=github&utm_medium=readme&utm_campaign=chartmogul)

## License

MIT. Copyright (c) 2026 Enterprise DNA.

## Ten questions to ask of your records

These join your own follow-up and evidence records with exported monthly revenue. They do not assert that ChartMogul cannot be configured to answer similar questions.

1. Which customers reduced their monthly revenue? `churn-review`
2. Which customers expanded or returned after an observed zero month? `expansion-review`
3. How concentrated is the latest observed revenue? `concentration`
4. Which segment accounts for the comparable change? `segments`
5. What is retention for customers with both adjacent observations? `retention`
6. Which customers disappeared from a monthly export? `data-gaps`
7. How are groups doing since their first observed positive month? `cohorts`
8. Who has the most overdue revenue follow-ups? `owner-workload`
9. Which month-end reconciliations are stale after a correction? `signoffs`
10. Which customer records need an accuracy or retention review? `compliance`

## Your first hour: ten things to ask for

1. Put our name, logo and colours in brand.json.
2. Read the demo monthly review and its gaps.
3. Create an empty DATA_DIR for real work and run migrate without seed.
4. Rehearse the ChartMogul export import in our account currency.
5. Compare customer counts and monthly totals against the original export.
6. Assign each customer an owner and a segment.
7. Record our purpose and review dates for keeping customer information.
8. Assign our contraction follow-ups.
9. Reconcile a completed month against the source export.
10. Draft the revenue pack and add a new segment field with /customise.

## Metric boundaries and controls

Read [metric definitions](docs/metrics.md). All amounts are monthly recurring revenue observations, not recognised revenue, cash or profit. Annualised run rate is MRR times twelve, not a forecast. Retention excludes missing adjacent observations and currency changes. First positive observations establish observed cohorts, not acquisition dates. Never fill absent customers or blank cells with zero.

All commands accept --json. Names match without case and IDs can be partial; ambiguous matches list candidates and exit 1. Writes require an actor label, which is attribution, not authentication. The database has no public read policies; use a trusted owner connection. Protect the device, restrict database roles, and back up before importing. Direct database writes can bypass the CLI audit.

`npm run view` produces two read-only reports. `npm run docs` renders customer review packs and historical reconciliation records using brand.json. Documents are drafts for review and never sent. `npm test` uses an isolated temporary database and tests every CLI command, import rollback, duplicates, monetary arithmetic, gaps, currency separation and invalidated signoffs. CI is configured for Windows, Linux and a disposable Postgres service.
