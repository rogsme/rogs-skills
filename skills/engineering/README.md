# Engineering

Skills for everyday code work. Each one runs on its own, and the lifecycle skills call some of them.

## User-invoked

- [improve-codebase-architecture](./improve-codebase-architecture/SKILL.md): scan the codebase for shallow modules, present the deepening opportunities as a visual HTML report, then grill through the one you pick.
- [retro](./retro/SKILL.md): run a retrospective on a coding session and suggest changes to the agent's environment (navigation pointers, automated checks, review standards, tool economy), most severe first.

## Model-invoked

- [tdd](./tdd/SKILL.md): test-driven development in vertical red-green slices, testing behavior at agreed seams.
- [codebase-design](./codebase-design/SKILL.md): the shared vocabulary for deep modules (module, interface, depth, seam, adapter, leverage, locality), with the deletion test and the design-it-twice pattern.
- [writing-for-agents](./writing-for-agents/SKILL.md): how to write skills, `AGENTS.md`/`CLAUDE.md` and any other document an agent reads.
- [diagnosing-bugs](./diagnosing-bugs/SKILL.md): reproduce a hard bug or performance regression with a tight loop that goes red, then minimise, hypothesise, instrument, fix and clean up.
- [grill-with-docs](./grill-with-docs/SKILL.md): grill a plan or design in rounds until every decision is settled, recording glossary terms and ADRs as they land.
- [commit](./commit/SKILL.md): turn the worktree, or a scope another skill hands over, into atomic commits that follow the repository's conventions.
- [create-pr](./create-pr/SKILL.md): open one pull request on any forge from the repository's template, with every field verified after publishing; work-ticket publishes through it.
- [simplify-branch](./simplify-branch/SKILL.md): run a taste pass over a branch's change, applying and committing only the cleanups that keep behavior; work-ticket runs it when the taste pass is on.
- [review-plan](./review-plan/SKILL.md): have a model from another vendor review a finished plan before you see it, then settle every finding against the code; start-ticket calls it when plan review is on.
- [present-plan](./present-plan/SKILL.md): show the settled plan and its review findings in a local Lavish browser session, with saved source revisions and approval kept in the conversation.
- [git-archaeology](./git-archaeology/SKILL.md): report what a repository's history says about churn, ownership concentration, fix hotspots and momentum, as indicators to investigate.
- [wiki](./wiki/SKILL.md): generate and maintain a codebase wiki in `docs/wiki/`, kept accurate by incremental, audit and full runs.
