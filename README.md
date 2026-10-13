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

## License

MIT. See [LICENSE](LICENSE).
