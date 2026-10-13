# rogs-skills

Agent skills that carry a ticket from creation to a merged pull request, plus the engineering skills that workflow leans on. They use the [Agent Skills](https://agentskills.io/specification) format and install with the [skills](https://skills.sh) CLI, so they work in Claude Code, OpenCode and the other agents that CLI supports.

## Install

```bash
npx skills add https://git.rogs.me/rogs/rogs-skills.git
```

The CLI asks which skills to take, which agents to install them for, and whether they go into the current project or into your home directory. The same repository over SSH:

```bash
npx skills add git@git.rogs.me:rogs/rogs-skills.git
```

One skill on its own:

```bash
npx skills add https://git.rogs.me/rogs/rogs-skills.git --skill tdd
```

Pull newer versions later with `npx skills update`.

## Skills

### Lifecycle

Run `/setup-rogs` in a repository before the others; they refuse to run without its configuration.

User-invoked:

- [setup-rogs](skills/lifecycle/setup-rogs/SKILL.md): set up, update or check this repository's configuration for the lifecycle.

Model-invoked:
- [create-ticket](skills/lifecycle/create-ticket/SKILL.md): audit the code and the tracker, then draft and create worktree-safe tickets after you approve a preview.
- [start-ticket](skills/lifecycle/start-ticket/SKILL.md): investigate a ticket read-only in its worktree and return a plan for approval.

### Engineering

Model-invoked:

- [tdd](skills/engineering/tdd/SKILL.md): test-driven development in vertical red-green slices, testing behavior at agreed seams.
- [writing-for-agents](skills/engineering/writing-for-agents/SKILL.md): how to write skills, `AGENTS.md`/`CLAUDE.md` and any other document an agent reads.
- [resolving-merge-conflicts](skills/engineering/resolving-merge-conflicts/SKILL.md): resolve an in-progress merge or rebase conflict hunk by hunk, by tracing each side's intent to its source.
- [grill-with-docs](skills/engineering/grill-with-docs/SKILL.md): grill a plan or design in rounds until every decision is settled, recording glossary terms and ADRs as they land.
- [commit](skills/engineering/commit/SKILL.md): turn the worktree, or a scope another skill hands over, into atomic commits that follow the repository's conventions.
- [wiki](skills/engineering/wiki/SKILL.md): generate and maintain a codebase wiki in `docs/wiki/`, kept accurate by incremental, audit and full runs.

## Credits

Several skills are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, Copyright (c) 2026 Matt Pocock). Each folder below carries his license notice.

| Skill | Upstream source | Commit |
|---|---|---|
| `tdd` | `skills/engineering/tdd/` | `49dd158` |
| `writing-for-agents` | `skills/productivity/writing-for-agents/` | `49dd158` |
| `resolving-merge-conflicts` | `skills/engineering/resolving-merge-conflicts/` (deleted upstream in `daa01d8`) | `3216582` |
| `grill-with-docs` | `skills/engineering/grill-with-docs/`, `skills/productivity/grilling/`, `skills/engineering/domain-modeling/` | `49dd158` |
| `setup-rogs` | `skills/engineering/setup-matt-pocock-skills/` (setup flow, tracker and domain seeds) and `skills/engineering/domain-modeling/ADR-FORMAT.md` | `49dd158` |
| `create-ticket` | `skills/engineering/to-tickets/` (slicing rules and breakdown review) | `49dd158` |

## License

MIT. See [LICENSE](LICENSE).
