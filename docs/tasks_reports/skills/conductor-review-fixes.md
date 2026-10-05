# Conductor PR #57 review fixes

- **Status:** SUCCESS (documentation correction; controller review and writeback pending).
- **Invariant:** retries require reconciliation; authority and confidentiality stay explicit;
  evidence fits the medium; physical safety is context-specific; dependency arithmetic includes
  relationship and lag; whole-project startup and applicable commercial gates remain intact.
- **Implementation:** issues 1–20 applied separately, in order, to the eight guidance files under
  `.agents/skills/conductor/guidance/`; final wording for issues 6 and 20 refined separately after
  lead review. `SKILL.md §3 Work records` was also updated to keep existing identifier schemes
  such as J-XXX. This report is added; no runtime enforcement is claimed.
- **Baseline:** clean detached HEAD `bfd64ee66bef880a80151f4424056258a683cdd9`.

## Issue completion and adversarial review

Each row is a semantic review of the revised instructions, not a live-world experiment.

| Issue | File and correction | Adversarial case: decision and reason |
|---|---|---|
| 1 | autonomy.md: malformed-reply reconciliation | Partial reply with payment already sent: reconcile every possibly executed action against log and actual target; no duplicate payment or replay of uncertain non-idempotent effects. |
| 2 | autonomy.md: standing retry rules | Idempotent timeout can retry after reconciliation within contract/authority; unknown payment blocks and escalates; observed no-effect actions can retry. |
| 3 | confidentiality.md: confidential distribution | Signed public download fails confidentiality: signing authenticates, while restricted access or recipient-only encryption protects secrecy. |
| 4 | confidentiality.md and autonomy.md: supported offline modes | Unavoidable hosted certification remains an authorised mapped connected/mixed step, NOT VERIFIED OFFLINE; an essential strictly offline requirement blocks, without invented replacement or whole-project offline claim. |
| 5 | confidentiality.md: internet authentication | Dedicated scoped authorised project token is allowed for the named service; personal login, sync and extensions remain prohibited; no raw secrets in the map. |
| 6 | decisions.md: immutable scored comparison | Weights cannot change within a scored comparison, regardless of motive; genuine changed priorities require a new recorded comparison with criteria/weights/rationale set before fresh scoring, prior comparison retained and every option rescored. |
| 7 | design.md: reversible undo only | Irreversible delete is recorded and visible but never promised undo; exact confirmation or scoped standing authority remains required. |
| 8 | design.md: actual-medium evidence | Voice requires listening, API/CLI real outputs, devices observed controls; no invented screenshots. Relevant visual sizes/themes and measurements remain; unavailable observation is not verified. |
| 9 | operations.md: incident publishing authority | No incident publish grant: draft only, obtain approval by permitted route before sending; incident urgency does not broaden destinations or audiences. |
| 10 | operations.md: reconciled remediation | Timeout resend could duplicate delivery: reconcile each actual outcome, choose authorised correction, block uncertain non-idempotent replay, independently verify corrective effect. |
| 11 | operations.md: useful restore proof | Corrupt backup with equal counts does not pass: scratch-copy critical journeys, integrity constraints and required records must work; gaps remain recorded. |
| 12 | physical.md: safe commissioning and acceptance | Unsafe live induced fault is not demanded: use controlled simulation or safe fault injection with method/limits recorded; simulation does not prove real safety, and required unsafe live acceptance remains pending. |
| 13 | physical.md: verified read-only exemption | Read API that clears a log is an action requiring contract/authority; ordinary reads still need purpose/data permission and confidentiality, not merely device access. |
| 14 | physical.md: decided safe state | Fire-exit door remains unlocked and frost protection follows its decided state, not universal stop. Missing/unknown states block commissioning/operation; watchdog tests observe that state safely. |
| 15 | planning.md: typed lagged dependencies | All FS/SS/FF/SF links apply their recorded lag/calendar and endpoint bounds; maximum forward/minimum backward bounds preserve cure waits and finish-linked overlap (arithmetic below). |
| 16 | planning.md: achievable source review | Tracker date outside a heading must be reviewed; empty evidence and dated unscheduled items fail. No-heading shortcut and nonexistent checker claim removed; native validation or independent recorded review is required. |
| 17 | product.md and planning.md: valid trace targets | Certification-only milestone can serve a requirement/acceptance criterion/accepted decision without invented metric; unsupported measures and work with no valid target remain findings. |
| 18 | product.md: bounded fallback only | Whole project with objective only cannot begin an action batch: written VISION, PLAN and all applicable minima required; bounded work retains readiness, vision and floor limits. |
| 19 | product.md: completed project exchange | Unrelated salary never proves exchange; settled customer invoice or paid buyer order must match recorded offer and delivered promise with collection/reconciliation. Selling a genuine project service remains allowed. |
| 20 | product.md: applicable money release gate | Only projects taking no money record this gate not applicable with reason, not pass; paid open-source products still run the real authorised small payment/refund checks. A free launch never cancels a must-earn business exchange requirement. |

## Verification and evidence

Temporary standard-library scripts and outputs are retained under `/tmp/opencode/`, not shipped.
Application lint, type checks, build and tests: NOT RUN (docs-only change; no conductor suite).
No application/database/networked tests or external procedures were run. Documentation index
was regenerated with `mise x node@latest -- npx tsx scripts/generate-docs-data.ts`. Mise installed
Node, and npx fetched `tsx@4.23.15` because it was not present. No credentials were inspected.
No push or submission actions were taken.

Commands and observed contract-check summaries:

```text
python /tmp/opencode/conductor_contract_check.py
Baseline: Contract checks: 0/20 passed; 20 failed (expected exit 1).
Final: Contract checks: 20/20 passed; 0 failed
git diff --check: PASS (no output)
```

Before any repository edit, baseline output was saved as
`/tmp/opencode/conductor-baseline.txt`. After each separate issue edit, the command
`python /tmp/opencode/conductor_contract_check.py --issue N` confirmed its intended clauses
and ran `git diff --check` before the next issue. Each output was:

```text
Issue NN: PASS
Contract checks: 1/1 passed; 0 failed
git diff --check: PASS (no output)
```

Individual outputs: `/tmp/opencode/conductor-issue-01.txt` through
`/tmp/opencode/conductor-issue-20.txt`. Final output: `/tmp/opencode/conductor-final.txt`.
Assertions cover scoped exceptions and obsolete wording, including the absent checker reference;
token checks alone are not semantic proof, hence the twenty scenario decisions above.

After lead review, issues 6 then 20 were refined and separately rechecked with `--issue 6` and
`--issue 20`, each producing its `Issue NN: PASS`, `1/1 passed; 0 failed` and clean diff output.
The updated checker reads original HEAD without reverting files:

```text
python /tmp/opencode/conductor_contract_check.py --head
Contract checks: 0/20 passed; 20 failed
```

Expected exit 1; full output: `/tmp/opencode/conductor-head-baseline.txt`.
`python /tmp/opencode/conductor_contract_check.py --mutations` produced:

```text
Mutation issue 06: old motive-only weight restriction: REJECTED (only issue 06 fails)
Mutation issue 20: blanket open-source exemption: REJECTED (only issue 20 fails)
In-memory negative checks: 2/2 rejected; repository files unchanged
```

Evidence: `/tmp/opencode/conductor-mutations.txt`. Mutations alter strings in memory only.
The controller could not read temporary artifacts through its file tool; complete sources and
verbatim final outputs are also delivered in the handoff message, without copying scripts into
the repository or bypassing that permission boundary.

`python /tmp/opencode/conductor_arithmetic_check.py` produced:

```text
FS cure: A ES/EF=(0, 2), LS/LF=(0, 2); B ES/EF=(9, 12), LS/LF=(9, 12): PASS
FF overlap: A ES/EF=(0, 10), LS/LF=(0, 10); B ES/EF=(7, 10), LS/LF=(7, 10): PASS
SS lag: A ES/EF=(0, 10), LS/LF=(0, 10); B ES/EF=(2, 5), LS/LF=(7, 10): PASS
SF release bound: A ES/EF=(0, 10), LS/LF=(0, 10); B ES/EF=(0, 3), LS/LF=(7, 10): PASS
Multiple predecessors: max(0,9,7)=9; backward A LS=0, C LS=2; multiple successors: min(10,0,2)=0: PASS
Obsolete zero-lag FS: cure B ES/EF=(2,5), violates required ES>=9; FF B=(10,13), misses earliest overlap (7,10): DETECTED
Arithmetic: 4 relationship cases + max/min bounds + 2 obsolete-algorithm counterexamples: PASS
```

Evidence: `/tmp/opencode/conductor-arithmetic.txt`. These independently specified examples evaluate
the eight documented bounds on a common day axis, not a new scheduler or calendar implementation.

`python /tmp/opencode/conductor_markdown_check.py` checks introduced/modified local Markdown
references and section headings, balanced fences and exact changed-file scope. Evidence:
`/tmp/opencode/conductor-markdown.txt`. Output:

```text
Local Markdown references/sections introduced or modified: 5 valid
Introduced or modified headings: 3 unique
Balanced fences: 9/9 files
Change scope: 8 guidance Markdown files + `SKILL.md` + task report + generated `src/lib/docsIndex.ts`; no lockfile changes
```

Final Git checks: `git diff --check`,
`git status --short --untracked-files=all`, `git diff --stat`, and full `git diff`; the untracked report is included
separately in `/tmp/opencode/conductor-full-diff.txt`. Git state/stat evidence:
`/tmp/opencode/conductor-git-state.txt`.

An artifact-export wrapper's guessed 129-line report assertion failed (actual count was 128);
the export was corrected to report the measured count. All mandatory check commands passed.

**Known limitations:** documentation checks and scenario review verify the instructions, not a
running harness, payment service, physical installation, actual backup, product observation or
native-calendar tool. Those future applications still require their own authorised evidence.
Controller review and final writeback remain controller-owned.
