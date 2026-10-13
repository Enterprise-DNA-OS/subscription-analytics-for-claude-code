# Record checks and source rules

Checked 13 October 2026. These are prompts to review records, not a certificate of compliance. No automatic data deletion, statutory filing or financial advice is performed.

| Check | What runs | Source and limit |
|---|---|---|
| ACC-01 | Missing accuracy review or older than 30 days | [NZ Privacy Act principle 8](https://www.privacy.org.nz/privacy-principles/8/) requires reasonable accuracy checks before use or disclosure. Thirty days is this repo's editable internal policy, not a legal deadline. |
| RET-01 | Missing or past retention_review_on | [NZ Privacy Act principle 9](https://www.privacy.org.nz/privacy-principles/) concerns retaining personal information only as long as needed. The date is set by the operator; this command does not decide deletion or statutory retention periods. |
| PUR-01 | Blank processing purpose | [NZ Privacy Act principle 1](https://www.privacy.org.nz/privacy-principles/) limits collection to a lawful, necessary purpose. A recorded purpose is evidence for a review, not proof of lawfulness. |
| OWN-01 | Blank review owner | Internal responsibility policy. Not a statutory requirement. |

Use compliance with data-gaps and signoffs. Reconciliation records the source reference, operator and a fingerprint of the observations. Changed financial amounts make a prior reconciliation stale. This supports traceability; it does not certify completeness, accounting treatment or vendor calculations.

Customer information can include identifiable people. Restrict file and database access, encrypt your device and backups, and set retention with your business's obligations in mind. The database enables row-level security without public policies. The trusted database owner can bypass those policies and the CLI audit; the --actor label is not an authenticated identity. Agree access controls before a shared deployment.
