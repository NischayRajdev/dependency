# Contributing

## Workflow

1. Create a small issue/task linked to a feature and acceptance condition.
2. Use a short branch such as `feat/inventory` or `test/reachability-aliases`.
3. Keep changes focused and add normal, failure and unsupported tests.
4. Open a pull request with evidence, security impact and remaining limitations.
5. The other teammate reviews mappings, expected results and risky boundary changes.
6. Merge only after required checks pass. During the hackathon, prefer small reversible commits.

## Pull request checklist

- What requirement/defect does this address?
- What inputs and outputs changed?
- Which tests were added and who authored expected results?
- Can this execute or transmit target code/data?
- Does it change supported/unsupported patterns?
- Does any report wording overstate evidence?
- Are schemas, `DECISIONS.md` and docs updated?

## Review requirements

The author of a vulnerable-function mapping cannot be its only reviewer. The author of traversal logic should not author every held-out expected result. Security-boundary changes require both teammates.

## Coding conventions

- TypeScript strict mode.
- Typed unions for status/uncertainty.
- Pure transformations where practical.
- Deterministic output ordering.
- No shell string construction from untrusted data.
- No swallowed analyser failure or empty catch block.
- Every limit hit produces a visible diagnostic.
- No dependency added without purpose, licence and security review.

## Commit examples

- `feat(inventory): preserve duplicate package instances`
- `test(reachability): add shadowed-binding negative fixture`
- `security(scanner): reject symlink escape`
- `docs(scope): mark computed require unsupported`

## Generated code

AI-generated code receives the same review and testing as human code. Prompts are not evidence. Do not allow a coding agent to both invent a vulnerable-function mapping and declare its test expected result.

