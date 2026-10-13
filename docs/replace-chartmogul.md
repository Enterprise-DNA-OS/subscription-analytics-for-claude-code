# Bring ChartMogul monthly revenue history across

Checked 13 October 2026 against [ChartMogul's export documentation](https://help.chartmogul.com/article/233-exporting-different-types-of-data). An Admin or Owner exports from Settings > Exports > MRR per Customer per Month. ChartMogul emails a download link. Save the CSV before cancelling access.

The documented columns are customer_uuid, customer_external_ids, customer_name, company_name and calendar month-end columns. The report uses the account's primary currency; enter that exact currency at import. Customer UUID maps to source_id; company_name, when present, becomes name. Each nonblank monthly cell becomes an observation. customer_external_ids is not used as the stable identity; retain the original export. Other extra columns are ignored. Plan and quantity report variants are rejected to prevent double counting.

Create an empty DATA_DIR, run npm run migrate without seeding, then:

```bash
npm run revenue -- import chartmogul --file=export.csv --currency=NZD --actor="Mere" --dry-run
npm run revenue -- import chartmogul --file=export.csv --currency=NZD --actor="Mere"
npm run revenue -- data-gaps
npm run revenue -- monthly-review
```

Use your actual currency and actor. Dry-run rolls back all writes. Import is atomic across the file; malformed rows, repeated UUIDs, invalid dates or amounts reject the whole file. Repeating a file preserves identical observations. Changed observed values update with before/after audit evidence and invalidate affected reconciliations. Blank cells leave existing observations unchanged; they never erase values or imply churn. Do not import two separate ChartMogul accounts with overlapping IDs into one database without a tested namespace migration.

Compare customer counts, date coverage and monthly totals to the original export. Record owners, segments, purposes and review dates; these are not part of this export. Review gaps before signing off. Retain source exports in restricted storage and test a backup restore before cancelling. One import brings this report across; invoice lines, plan history, currencies before ChartMogul conversion, CRM messages and integrations do not arrive in this report. The base does not recalculate MRR from invoices. Enterprise DNA can build the agreed connections and additional record mappings into your version.

Full export: npm run revenue -- export --file=backup.json. It includes all records and the audit history and refuses to overwrite an existing file. Use database backups for restoration; the JSON export is portable evidence, not an implemented restore command.
