# Lifecycle

Skills that carry a ticket from creation to a merged pull request. Run `/setup-rogs` once per repository first: the other skills read the configuration it writes and refuse to run without it. They never call one another; each stage ends with a status line, and you start the next one.

## User-invoked

- [setup-rogs](./setup-rogs/SKILL.md): set up, update or check this repository's configuration for the lifecycle.

## Model-invoked

- [create-ticket](./create-ticket/SKILL.md): audit the code and the tracker, then draft and create worktree-safe tickets after you approve a preview.
- [start-ticket](./start-ticket/SKILL.md): investigate a ticket read-only, optionally review and present its plan in the browser, then wait for approval in the conversation.
- [work-ticket](./work-ticket/SKILL.md): implement the approved plan through atomic commits, the browser pass, a pull request with green exact-head CI, and the tracker handoff.
- [review-pr](./review-pr/SKILL.md): review a pull request independently at its exact head and post evidence-backed findings with a verdict.
- [address-pr-review](./address-pr-review/SKILL.md): verify and answer review feedback in at most two rounds, or bring the branch up to date with the base.
- [finish-ticket](./finish-ticket/SKILL.md): merge the reviewed pull request after human verification, verify the merge, and complete its tickets.
