# Rehearse and import the ChartMogul monthly customer export

Use MRR per Customer per Month. Confirm the account currency with the operator. Review the dry-run counts and data-gaps, then repeat without --dry-run when the import is authorised. Never assume a blank cell means zero.

```bash
npm run revenue -- import chartmogul --file=export.csv --currency=NZD --actor="OPERATOR" --dry-run --json
```

Replace placeholders from the operator brief. Writes need --actor. On ambiguous names list the candidates and ask for the ID. Never invent evidence.
