# Lifecycle

Skills that carry a ticket from creation to a merged pull request. Run `/setup-rogs` once per repository first: the other skills read the configuration it writes and refuse to run without it. They never call one another; each stage ends with a status line, and you start the next one.

## User-invoked

- [setup-rogs](./setup-rogs/SKILL.md): set up, update or check this repository's configuration for the lifecycle.

## Model-invoked
- [create-ticket](./create-ticket/SKILL.md): audit the code and the tracker, then draft and create worktree-safe tickets after you approve a preview.
