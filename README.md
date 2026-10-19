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

It explores the repository, asks one question at a time (the tracker and its connection, the forge, CI, pull requests, verification commands, domain docs, optional features), shows drafts, and writes `docs/agents/issue-tracker.md`, `forge.md`, `workflow.md` and `domain.md`, plus a short `## Ticket lifecycle` block in `AGENTS.md` or `CLAUDE.md`. It has built-in guides for Linear, Kaneo, GitHub Issues and local markdown tickets, for GitHub, Gitea and GitLab, and for plan reviewers run through Claude Code or OpenCode; for any other tracker or forge, it writes the guide from your description.

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

- The lifecycle skills never call one another. Each ends with a status line, and you start the next stage: you approve the plan, run the human verification steps, and authorize the merge. They do call engineering skills: `commit` for every commit, `create-pr` to open the pull request, `review-plan` to have the plan reviewed before you see it, `present-plan` for optional browser presentation, `tdd`, `diagnosing-bugs` and `resolving-merge-conflicts` where they apply.
- The implementer never reviews its own change, the fixer never resolves review threads, the reviewer never writes to the tracker, and only `finish-ticket` merges.
- Every claim (CI is green, reviewed, verified) names the exact head SHA, and that head contains the current base.
- Branches take the base by merging it; nothing rebases or force-pushes a published branch.
- Optional, per repository: bundles (one pull request delivering several tickets), a browser pass with captures (it needs the `playwright-cli` skill, installed with `playwright-cli install --skills`), model routing, read-only client notes, plan review by another vendor, and local browser plan presentation after review.

### Browser plan review

Enable `Plan presentation` through `/setup-rogs` after preparing the renderer that `present-plan` describes. It needs Node.js 22+ and npm/npx. Lavish runs through pinned `npx` execution, with no local or global installation; npm may download it to its cache on first use. Only Marked and Mermaid need the separate renderer directory outside the checkout. No upstream Lavish skill, MCP server or global hook is required. Setup checks these prerequisites without local installation or agent-setting changes.

`start-ticket` presents the full canonical plan, diagrams and adversarial findings in Lavish. The agent saves feedback with its polled source revision and checks delayed comments against earlier snapshots. Substantial human-requested revisions receive another single adversarial round when plan review is on. Plan approval stays in the agent conversation, and implementation still starts through `work-ticket`. Closing a browser or seeing a delivery receipt never authorizes work.

Presentation is independent of plan review and optional under configuration v1. A missing feature row means off. Missing dependencies or browser failures return the full report in the terminal with an explanation, including any review-failure warning. Artifacts stay outside worktrees, telemetry is disabled, assets load locally, and the wrapper rejects non-loopback or other-owner services. To revert, turn presentation off; preserve other sessions and saved artifacts.

## Requirements

- `git`.
- The tracker's MCP server or CLI, connected in your agent. `/setup-rogs` checks the connection but never edits your agent's configuration.
- The forge's CLI, signed in: `gh` 2.99 or newer, `tea`, or `glab`.
- For plan review, the reviewer's agent CLI, signed in: `claude`, or `opencode` with the read-only agent that `/setup-rogs` describes.
- For plan presentation, the `present-plan` skill, Node.js 22+, npm/npx, its Marked/Mermaid renderer dependencies, and a local browser. Its setup reference holds the pinned npx command and renderer preparation procedure.

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
- [present-plan](skills/engineering/present-plan/SKILL.md): present the canonical plan and its review findings in a local Lavish browser session, with saved source revisions and approval kept in the conversation.
- [git-archaeology](skills/engineering/git-archaeology/SKILL.md): report what a repository's history says about churn, ownership concentration, fix hotspots and momentum, as indicators to investigate.
- [wiki](skills/engineering/wiki/SKILL.md): generate and maintain a codebase wiki in `docs/wiki/`, kept accurate by incremental, audit and full runs.

### Writing

Model-invoked:

- [avoid-ai-tropes](skills/writing/avoid-ai-tropes/SKILL.md): write, proofread or deep-rewrite prose without the tells of machine-written text, keeping its meaning and the author's voice.
- [asd-ste100](skills/writing/asd-ste100/SKILL.md): write or rewrite technical documentation in ASD-STE100 Simplified Technical English (Issue 9).
- [chat-paste](skills/writing/chat-paste/SKILL.md): turn a message into a local preview page with buttons that copy it as Slack or Teams rich text.

## Scripts

`bin/` holds terminal scripts for the person who runs the lifecycle. `npx skills add` installs only the skills, so install a script from a clone of this repository.

### tkt

`tkt` does the mechanical steps around the lifecycle skills: it creates the ticket's worktree, opens a [herdr](https://herdr.dev) tab named after the ticket, starts Claude Code or OpenCode in it, and hands the agent its prompt. Each command is one step you take. Nothing chains stages: you still approve plans, run the human verification steps and merge, and `tkt ls` only suggests the next command.

Install it by linking it into your `PATH`:

```bash
ln -s "$PWD/bin/tkt" ~/.local/bin/tkt
```

It needs bash 4.4 or newer, git, jq and the coreutils; herdr 0.9.3 or newer, with tkt running inside a herdr pane; [worktrunk](https://worktrunk.dev) (`wt`) 0.68 or newer; Claude Code or OpenCode; and the configuration `/setup-rogs` writes. `tkt done` and `tkt ls` read pull requests through `gh` and support GitHub forges only.

worktrunk must name each worktree directory after its branch, and setup that an agent needs (copying `.env` files and dependencies) belongs in a `pre-start` hook. worktrunk runs `post-start` hooks in the background, so an agent could start before they finish. For example:

```toml
worktree-path = "~/code/worktrees/{{ repo }}/{{ branch | sanitize_hash }}"

[pre-start]
copy = "wt step copy-ignored"
```

#### A ticket from start to merge

Each step is one command you run or one answer you give in the ticket's tab. `tkt ls` shows where every ticket stands and suggests the next step.

1. Start the ticket: `xclip -selection clipboard -o | tkt start --prompt -` with its start-ticket block on the clipboard, or `tkt start ACM-12` to send only the `start` stage line. The agent investigates and ends with `Status: AWAITING_APPROVAL`.
2. Read the plan in the tab, then approve it there or ask for changes. The same session goes on to implement it with `work-ticket`, so answer in the tab instead of using `tkt run`, which would discard the plan.
3. When the agent ends with `Status: READY_FOR_REVIEW`, run `tkt run ACM-12 review`. The reviewer must not be the session that wrote the change, and `tkt run` always starts a fresh one.
4. Act on the verdict the review posts. On `CHANGES_REQUESTED`, run `tkt run ACM-12 address`. On `Status: BLOCKED_FOR_SYNC`, run `tkt run ACM-12 sync`. Both end with `Status: READY_FOR_REVIEW`, so go back to step 3. On `READY_FOR_HUMAN`, go on.
5. Do the human verification steps listed in the review summary. `tkt run ACM-12 verify` has an agent run them in a browser and report each one, but you decide whether each step passed.
6. In the tab, tell the agent to merge and which steps passed, such as "Merge the PR. Human verification steps 1 to 3 passed." No stage sends this, because `finish-ticket` merges only on your explicit instruction. When a step failed, say what you saw instead: the agent records it on the pull request and ends with `Status: HUMAN_QA_FAILED`, and you run `tkt run ACM-12 address`.
7. After the merge, run `tkt done ACM-12` from another tab.

When the checks fail on the pull request's head and no review is waiting to be addressed, run `tkt run ACM-12 ci`.

#### Commands

`tkt start [ID] --prompt TEXT` creates or reuses the worktree, opens the tab, starts the agent in build mode (Claude Code with `--dangerously-skip-permissions`, OpenCode on its Build agent) and sends the prompt, typically the dispatcher's start-ticket block. Without an ID it takes the first ticket id in the prompt; with both, they must match. Without `--prompt` it sends the `start` stage line. `--prompt -` reads the prompt from stdin, which keeps a long prompt out of your shell history (use `wl-paste` or `pbpaste` in place of `xclip`). It refuses when an agent already runs in the worktree; use `tkt run` or `tkt resume` then.

`tkt run ID STAGE` closes the ticket's idle agent and starts a fresh session in the same pane, on the ticket's preset, then sends the stage's line. The new agent remembers nothing of the old conversation and does not need to: every stage reads what it needs from the branch, the pull request and the tracker. Use it to begin the next stage with a clean context.

| Stage | What the fresh agent does | Run it when |
|---|---|---|
| `review` | Runs `review-pr` on the pull request at its head and posts the findings and a verdict. | The agent ends with `Status: READY_FOR_REVIEW`, after `work-ticket` or after `address-pr-review`. |
| `address` | Runs `address-pr-review`: fixes the valid findings, answers the rest, pushes, waits for green CI and replies to every comment. | The review at the head asks for changes, you left comments on the pull request yourself, or the merge stopped with `Status: HUMAN_QA_FAILED`. |
| `sync` | Runs `address-pr-review` to merge the base into the branch, with no review round. | The agent ends with `Status: BLOCKED_FOR_SYNC`, the review says the base moved, or the pull request conflicts with the base. |
| `ci` | Finds why the checks fail at the head, fixes the cause and pushes once. It reruns the job when the failure is infrastructure, such as a quota error. | The checks fail and no review findings wait to be addressed. |
| `verify` | Runs every step of the pull request's human verification section with the `playwright-cli` skill and reports each one as passed or failed. It changes no code and posts nothing. | The review at the head says `READY_FOR_HUMAN`, before you authorize the merge. |
| `start` | Runs `start-ticket` and returns a new plan. | You want to plan the ticket again from scratch, such as after the ticket changed. |

`tkt run` refuses while the agent works or waits for your answer; wait for it, or answer it in its tab. It also refuses while the ticket is still in planning (the last stage was `start`, the branch has no commits and the worktree is clean), because that agent may hold a plan waiting for your approval. `--force` replaces it anyway, and also replaces an agent in a state tkt does not recognize. `--as PRESET` runs the stage on another preset, for example a review by a different model than the one that wrote the code. `--pane PANE` picks the pane when several agents run in the worktree. `--prompt TEXT` sends your own line instead of a stage line, for a one-off task such as `tkt run ACM-12 --prompt "Check the flaky login test again."`.

`tkt resume ID` brings back the ticket's last conversation when no agent runs for it: you closed the tab, the agent exited or crashed, herdr restarted, or the machine rebooted. It relaunches the newest session (the one tkt recorded, otherwise the newest Claude Code or OpenCode session in the worktree) in bypass mode, in the ticket's tab or a new one, and sends nothing, so the agent waits where it stopped. Use it instead of `tkt run` when the conversation matters, such as a plan waiting for approval. When an agent already runs, it says where and changes nothing; `--focus` switches to its tab. `--session ID` resumes an older session, and `--as PRESET` picks the preset, and with it the harness.

`tkt done ID` closes the ticket's tabs and removes its worktree once its pull request is merged, the worktree is clean and no agent works in it. Run it from outside the ticket's tab and worktree. worktrunk deletes the branch when it is merged into the base. `--all` checks every ticket worktree and asks before removing them; add `--yes` when stdin is not a terminal.

`tkt ls` lists every ticket worktree with its tab, agent state, the last `Status:` line on the agent's screen, pull request, checks, review verdict at the head, commits behind the base, and a NEXT column. NEXT applies these rules in order and shows the first that matches:

- The pull request is merged: `tkt done ID`.
- The agent works, or waits for an answer: wait, or answer it in its tab.
- No pull request yet: `tkt resume ID` when no agent runs; otherwise approve the plan, read the agent's reason, or check the agent in its tab.
- The checks are pending: wait for CI.
- The review says the base moved, or the pull request conflicts: `tkt run ID sync`.
- The review at the head has findings: `tkt run ID address`.
- The checks fail: `tkt run ID ci`.
- The review at the head is clear: `tkt run ID verify`.
- Anything else: wait for review. When no automated reviewer runs on the forge, that means `tkt run ID review`.

A verdict on an older head does not count, so after every push NEXT waits for a new review. `--no-fetch` skips the `git fetch` that refreshes the commits-behind count.

`start`, `run`, `resume` and `done` take `--dry-run`, which prints the changes instead of making them. `-C DIR` runs tkt as if started in DIR, and `-v` prints every external command. `tkt --help` lists every option.

#### Configuration and state

Presets choose the agent. Without a presets file, `claude` and `opencode` run with their default models. Write `~/.config/tkt/presets` to add your own, one per line: a name, the harness (`claude` or `opencode`), a model (`-` for the default) and the `Model:` values it serves (`*` for any):

```
# name  harness   model              serves
claude  claude    -                  frontier
big     opencode  acme/large#high    frontier
fast    opencode  acme/small#max     small
```

A Claude model reads `model#effort`; an OpenCode model reads `provider/model#variant`. When a prompt carries a `Model:` line (the dispatcher copies it from the ticket's model routing), `tkt start` picks the first preset that serves it; `--as NAME` picks one yourself. Tabs for any preset but the first get the preset's name, such as `ACM-12 (fast)`.

To change a stage line or add a stage, write `~/.config/tkt/stages`, one per line: the stage name, then the text. `{id}` becomes the ticket id.

tkt keeps each ticket's state (preset, session, tab, pane) in the worktree's git directory, so it disappears with the worktree, and logs every command it runs to `~/.local/state/tkt/tkt.log` (prompts appear as their size and hash). Exit codes: 0 done, 1 a tool failed, 2 bad usage or input, 3 environment or configuration, 4 refused because of the current state, 5 uncertain outcome, so inspect the tab before you retry. Nothing prompts when stdin is not a terminal, so other programs can run tkt. [`bin/tests/README.md`](bin/tests/README.md) describes the tests.

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
