# Known Issues

Use these existing packaged references for targeted recovery. They are not proof
of a product defect or a list of fixes delivered in newer plugin releases.

| Symptom | Reference and applicability |
| --- | --- |
| Initial scaffold exists but Git authentication/push failed | [First-run Git Credential Manager recovery](../../create-app/references/troubleshooting.md#first-run-git-credential-manager-recovery). Preserve the scaffold; do not rerun create/delete the app. |
| `npx ms` runs an unrelated package | [Common build/dev failures](../../create-app/references/troubleshooting.md#common-build--dev-failures). Use the installed CMR binary; verify the actual action before classifying an agent mistake. |
| Dev startup fails or auth/config is invalid | [/dev recovery](../../dev/SKILL.md). Inspect the actual error and follow its confirmation gates. |
| Backend startup is incomplete | [/add-backend lifecycle](../../add-backend/SKILL.md#4-follow-the-app-lifecycle). Do not bypass pending backend setup with config-only mode. |

For a newer-release fix, verify the changed instruction at an identifiable
published release/commit. Record the affected version range, fixed version,
source and applicability evidence before recommending an update. Do not add
speculative fix versions, copy customer identifiers, or treat an unrelated
public-documentation change as a plugin release fix.
