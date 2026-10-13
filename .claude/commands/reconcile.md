# Compare the observed monthly total with supplied source evidence

Read the result and report facts with the currency, month and coverage. Missing observations are unknown.

```bash
npm run revenue -- reconcile --month=YYYY-MM-DD --currency=NZD --source-total=AMOUNT --evidence="SOURCE REFERENCE" --actor="OPERATOR" --json
```

Replace placeholders from the operator brief. Writes need --actor. On ambiguous names list the candidates and ask for the ID. Never invent evidence.
