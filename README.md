# skills

Agent skills that carry a ticket from creation to a merged pull request, plus the engineering and writing skills that workflow leans on and that stand on their own. They use the [Agent Skills](https://agentskills.io/specification) format and install with the [skills](https://skills.sh) CLI, so they work in Claude Code, OpenCode and the other agents that CLI supports.

## Install

```bash
npx skills add https://gitlab.com/rogs/skills.git
```

The CLI asks which skills to take, which agents to install them for, and whether they go into the current project or into your home directory.

One skill on its own:

```bash
npx skills add https://gitlab.com/rogs/skills.git --skill tdd
```

Pull newer versions later with `npx skills update`.

This README writes skill names as Claude Code commands, such as `/setup-rogs`. In OpenCode, mention the skill as `@setup-rogs` instead.

## Set up a repository

The lifecycle skills are general: they learn where tickets live, how the forge is driven and how the code is checked from a few prose files in the repository. In each repository, run:

```
/setup-rogs
```

It explores the repository, asks one question at a time (the tracker and its connection, the forge, CI, pull requests, verification commands, domain docs, optional features), shows drafts, and writes `docs/agents/issue-tracker.md`, `forge.md`, `workflow.md` and `domain.md`, plus a short `## Ticket lifecycle` block in `AGENTS.md` or `CLAUDE.md`. It has built-in guides for Linear, Kaneo, GitHub Issues and local markdown tickets, and for GitHub, Gitea and GitLab; for anything else, it writes the guide from your description.

Commit those files to the base branch before cutting ticket worktrees. Run `/setup-rogs` again whenever something changes, or ask it to check the setup for drift: it updates its own files in place and never deletes anything. A lifecycle skill that finds the configuration missing stops with `Status: SETUP_REQUIRED` and points back to it.

## The ticket lifecycle

```
create-ticket       audit the code, then draft and create tickets
     |   you create a worktree: branch = directory name = lead ticket id
start-ticket        read-only investigation and plan        Status: AWAITING_APPROVAL
     |   you approve the plan
work-ticket         implement, verify, pull request, exact-head CI, handoff
                                                            Status: READY_FOR_REVIEW
     |   a fresh session, never the implementer
review-pr           findings pinned to the exact head
                                    Verdict: CHANGES_REQUESTED | READY_FOR_HUMAN
     |   when changes were requested or the base moved
address-pr-review   verify, fix or push back, reply; at most two rounds
                                                            Status: READY_FOR_REVIEW
     |   you run the human verification steps
finish-ticket       merge, verify, complete the tickets     Status: DONE
```

- The skills never call one another. Each ends with a status line, and you start the next stage: you approve the plan, run the human verification steps, and authorize the merge. They do call engineering skills: `commit` for every commit, `create-pr` to open the pull request, `tdd`, `diagnosing-bugs` and `resolving-merge-conflicts` where they apply.
- The implementer never reviews its own change, the fixer never resolves review threads, the reviewer never writes to the tracker, and only `finish-ticket` merges.
- Every claim (CI is green, reviewed, verified) names the exact head SHA, and that head contains the current base.
- Branches take the base by merging it; nothing rebases or force-pushes a published branch.
- Optional, per repository: bundles (one pull request delivering several tickets), a browser pass with captures (it needs the `playwright-cli` skill, installed with `playwright-cli install --skills`), model routing, and read-only client notes.

## Requirements

- `git`.
- The tracker's MCP server or CLI, connected in your agent. `/setup-rogs` checks the connection but never edits your agent's configuration.
- The forge's CLI, signed in: `gh` 2.99 or newer, `tea`, or `glab`.

## Skills

### Lifecycle

Run `/setup-rogs` in a repository before the others; they refuse to run without its configuration.

User-invoked:

- [setup-rogs](skills/lifecycle/setup-rogs/SKILL.md): set up, update or check this repository's configuration for the lifecycle.

Model-invoked:

- [create-ticket](skills/lifecycle/create-ticket/SKILL.md): audit the code and the tracker, then draft and create worktree-safe tickets after you approve a preview.
- [start-ticket](skills/lifecycle/start-ticket/SKILL.md): investigate a ticket read-only in its worktree and return a plan for approval.
- [work-ticket](skills/lifecycle/work-ticket/SKILL.md): implement the approved plan through atomic commits, the browser pass, a pull request with green exact-head CI, and the tracker handoff.
- [review-pr](skills/lifecycle/review-pr/SKILL.md): review a pull request independently at its exact head and post evidence-backed findings with a verdict.
- [address-pr-review](skills/lifecycle/address-pr-review/SKILL.md): verify and answer review feedback in at most two rounds, or bring the branch up to date with the base.
- [finish-ticket](skills/lifecycle/finish-ticket/SKILL.md): merge the reviewed pull request after human verification, verify the merge, and complete its tickets.

### Engineering

Model-invoked:

- [tdd](skills/engineering/tdd/SKILL.md): test-driven development in vertical red-green slices, testing behavior at agreed seams.
- [writing-for-agents](skills/engineering/writing-for-agents/SKILL.md): how to write skills, `AGENTS.md`/`CLAUDE.md` and any other document an agent reads.
- [resolving-merge-conflicts](skills/engineering/resolving-merge-conflicts/SKILL.md): resolve an in-progress merge or rebase conflict hunk by hunk, by tracing each side's intent to its source.
- [diagnosing-bugs](skills/engineering/diagnosing-bugs/SKILL.md): reproduce a hard bug or performance regression with a tight loop that goes red, then minimise, hypothesise, instrument, fix and clean up.
- [grill-with-docs](skills/engineering/grill-with-docs/SKILL.md): grill a plan or design in rounds until every decision is settled, recording glossary terms and ADRs as they land.
- [commit](skills/engineering/commit/SKILL.md): turn the worktree, or a scope another skill hands over, into atomic commits that follow the repository's conventions.
- [create-pr](skills/engineering/create-pr/SKILL.md): open one pull request on any forge from the repository's template, with every field verified after publishing; work-ticket publishes through it.
- [review-plan](skills/engineering/review-plan/SKILL.md): have a model from another vendor review a finished plan before you see it, then settle every finding against the code; start-ticket calls it when plan review is on.
- [git-archaeology](skills/engineering/git-archaeology/SKILL.md): report what a repository's history says about churn, ownership concentration, fix hotspots and momentum, as indicators to investigate.
- [wiki](skills/engineering/wiki/SKILL.md): generate and maintain a codebase wiki in `docs/wiki/`, kept accurate by incremental, audit and full runs.

### Writing

Model-invoked:

- [avoid-ai-tropes](skills/writing/avoid-ai-tropes/SKILL.md): write, proofread or deep-rewrite prose without the tells of machine-written text, keeping its meaning and the author's voice.
- [asd-ste100](skills/writing/asd-ste100/SKILL.md): write or rewrite technical documentation in ASD-STE100 Simplified Technical English (Issue 9).
- [chat-paste](skills/writing/chat-paste/SKILL.md): turn a message into a local preview page with buttons that copy it as Slack or Teams rich text.

## Credits

Several skills are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, Copyright (c) 2026 Matt Pocock). Each folder below carries his license notice.

| Skill | Upstream source | Commit |
|---|---|---|
| `tdd` | `skills/engineering/tdd/` | `49dd158` |
| `writing-for-agents` | `skills/productivity/writing-for-agents/` | `49dd158` |
| `resolving-merge-conflicts` | `skills/engineering/resolving-merge-conflicts/` (deleted upstream in `daa01d8`) | `3216582` |
| `grill-with-docs` | `skills/engineering/grill-with-docs/`, `skills/productivity/grilling/`, `skills/engineering/domain-modeling/` | `49dd158` |
| `diagnosing-bugs` | `skills/engineering/diagnosing-bugs/` | `49dd158` |
| `setup-rogs` | `skills/engineering/setup-matt-pocock-skills/` (setup flow, tracker and domain seeds) and `skills/engineering/domain-modeling/ADR-FORMAT.md` | `49dd158` |
| `create-ticket` | `skills/engineering/to-tickets/` (slicing rules and breakdown review) | `49dd158` |

Other bundled work:

| Skill | Source | License |
|---|---|---|
| `asd-ste100` | Written by David Mills; a working summary of [ASD-STE100](https://www.asd-ste100.org/) Issue 9, whose copyright ASD owns. Its folder carries his license notice. | MIT |
| `chat-paste` | [marked](https://github.com/markedjs/marked) 18.1.0, vendored in `assets/vendor/` with its license | MIT |

## License

MIT. See [LICENSE](LICENSE).
