# Maintaining rogs-skills

Agent Skills for a ticket-to-merge workflow, published at https://git.rogs.me/rogs/skills and installed with `npx skills add`. This file is for whoever edits the skills, agent or person.

## Layout

Skills live in bucket folders under `skills/`:

- `lifecycle/`: `setup-rogs` and the ticket skills that read the configuration it writes.
- `engineering/`: skills that stand on their own, including the ones the lifecycle calls.
- `writing/`: skills for prose meant for people: style, controlled English, chat formatting.

A skill is a folder whose name equals its `name`, holding a `SKILL.md` and, when needed, `references/`, `assets/`, `scripts/`, `tests/` or `evals/`. Each bucket has a `README.md` listing its skills (name linked to `SKILL.md`, one-line description) under **User-invoked** and **Model-invoked**. The top-level `README.md` lists every skill the same way. `.claude-plugin/marketplace.json` lists every skill's path under the plugin named after its bucket; the skills CLI turns each plugin into a collapsible group in the `npx skills add` picker and puts unlisted skills under "Other". A commit that adds, renames or removes a skill updates all three.

The repository ships skills only. Subagent definitions, harness commands, CI workflows, harness config files (`.mcp.json`, `opencode.json`), `agents/openai.yaml` and plugin manifests other than that `marketplace.json` stay out.

Never install skills into this checkout. `.gitignore` keeps a test install out of git, but the skills CLI would still discover it as a second copy of every skill.

## tkt

[tkt](https://gitlab.com/rogs/tkt), the terminal tool that runs the lifecycle's mechanical steps, lives in its own repository and reads no skill files. It depends on these lines from this one:

- the configuration contract's markers, `- Ticket ids:` line and `## Forge` fields;
- the status lines in the registry below;
- review-pr's `Verdict:` and `Reviewed head:` lines;
- the skill names in its built-in stage lines (`start-ticket`, `address-pr-review`, `review-pr`).

Before changing any of them, check tkt's `internal/contract` package, which pins each one with a fixture, and update it in step. Skills never call tkt.

## Frontmatter

Every `SKILL.md` opens with these keys, in this order:

```yaml
---
name: work-ticket
description: "One quoted line of at most 1024 characters."
license: MIT
metadata:
  rogs-skills/contract: "1"
---
```

- `name` equals the folder name and matches `^[a-z0-9]+(-[a-z0-9]+)*$`.
- The description stays on one quoted line. When the YAML fails to parse, Claude Code silently drops every field, including the ones that keep a skill user-invoked.
- Metadata values are strings. `rogs-skills/contract` is the configuration contract version the skill expects. OpenCode v2 lists every skill under `@` in its prompt, so no metadata key is needed to expose one; it ignores the v1 `opencode/slash` key.
- `compatibility` is optional and used only for real environment requirements.

## Invocation

Skills are model-invoked by default. Their description is written for the model: what the skill does first, then each distinct trigger once.

A user-invoked skill sets `disable-model-invocation: true` (Claude Code) and `opencode/autoinvoke: "false"` under `metadata` (OpenCode), always as a pair. Its description is a one-line summary for a person browsing slash commands. `setup-rogs` is the only user-invoked skill.

A step that runs another skill says so as an instruction to call the Skill tool, one skill per call: `Call the Skill tool with "commit"`. Only model-invoked skills can be reached that way; for a user-invoked skill, the step tells the user to run it. The lifecycle skills never call one another: each ends with a status line, and the human starts the next stage.

A skill never links into another skill's folder. Material that two skills need lives in a model-invoked skill they both call, or in the project configuration that `setup-rogs` writes.

## Agnosticism

Skills say "the tracker" and "the forge" and take every concrete operation from the project's configuration. Only the built-in guides (`skills/lifecycle/setup-rogs/assets/tracker-*.md` and `assets/forge-*.md`) name a tracker, a forge, their CLIs or their MCP tools. `setup-rogs/SKILL.md` and `setup-rogs/references/explore.md` may name the built-in guides when offering them, and a `## Sources` section may cite a vendor's documentation. The plan reviewer guides (`assets/reviewer-*.md`) are the only place that gives an agent CLI's flags; `review-plan` runs whatever command the project's `## Plan review` section holds.

## Configuration contract

`skills/lifecycle/setup-rogs/references/contract.md` defines the files `setup-rogs` writes into a project and the headings each lifecycle skill reads. It is the source of truth.

- A breaking change (a new required heading, a renamed heading, a heading whose meaning changes) bumps the version in the contract, in every seed's marker, in every skill's `rogs-skills/contract` metadata, and in each lifecycle skill's step 0.
- When a skill starts needing a heading, add it to the contract's table and to the shell check in that skill's step 0 in the same commit. The six checks share their helper functions word for word; change them together.
- Material that two or more lifecycle skills need lives in the project configuration, seeded from `setup-rogs/assets/`. Material that only one skill needs lives in that skill's `references/`.
- The ADR rules exist twice on purpose: `setup-rogs/assets/domain.md` for configured projects and `engineering/grill-with-docs/ADR-FORMAT.md` for any repository. Change them together.

## Status lines

The lifecycle skills hand off through these lines. A skill restates the lines it emits; this table is the registry.

| Line | Emitted by | Next |
|---|---|---|
| `Status: SETUP_REQUIRED` | any lifecycle skill | `/setup-rogs` |
| `Status: CONFIGURED`, `Status: SETUP_OK`, `Status: SETUP_DRIFT` | setup-rogs | the lifecycle, or another setup run |
| `Status: AWAITING_CREATE_APPROVAL`, `Status: TICKETS_CREATED` | create-ticket | the user |
| `Status: AWAITING_APPROVAL` | start-ticket | the user approves, then work-ticket |
| `Status: READY_FOR_REVIEW` | work-ticket, address-pr-review | review-pr in a fresh session |
| `Status: AWAITING_POST_APPROVAL`, `Status: REVIEW_POSTED`, `Status: READY_FOR_HUMAN` | review-pr | address-pr-review, or the human verification |
| `Verdict: CHANGES_REQUESTED`, `Verdict: READY_FOR_HUMAN`, with `Reviewed head:` and `Reviewed base:` lines | review-pr, inside the posted summary | address-pr-review, finish-ticket |
| `Status: BLOCKED_FOR_SYNC` | review-pr, finish-ticket | address-pr-review (sync-only pass) |
| `Status: HUMAN_QA_FAILED` | finish-ticket | address-pr-review |
| `Status: BLOCKED_POST_MERGE`, `Status: DONE` | finish-ticket | the user |
| `Status: BLOCKED`, followed by a `Reason:` line | any lifecycle skill | the user |

## Writing

- Plain words, short sentences, present tense. State the behavior to follow; use a prohibition only as a guardrail, and pair it with the behavior to use instead.
- No em dashes or en dashes. Rewrite the sentence with a comma, colon, period, parentheses or a conjunction instead of swapping the character.
- No bold-label bullets (`- **Label**: text`), arrows or other characters a keyboard cannot type. Box-drawing characters inside directory-tree code blocks are fine. Code and test fixtures may contain the characters their behavior needs (a formatter's emoji, a checker's dash pattern); write them as escapes when the language allows, and in prose name a character by its code point, such as "(U+2014)".
- No client, employer or personal data. Examples use `Acme`, team key `ACM`, tickets like `ACM-123`, and hosts like `git.example.com`.
- Call the Skill tool with "writing-for-agents" before creating or editing a skill or this file.

## Licensing

The repository is MIT. Text derived from mattpocock/skills (MIT, Copyright (c) 2026 Matt Pocock) keeps his notice: each skill folder that contains it carries a `LICENSE` with both notices, so the notice travels with installed copies, and the "Credits" section of `README.md` records the upstream path and commit of every derived file.

## Upstream forks

| Skill | Upstream (mattpocock/skills) | Pinned commit |
|---|---|---|
| `tdd` | `skills/engineering/tdd/` | `49dd158` |
| `writing-for-agents` | `skills/productivity/writing-for-agents/` | `49dd158` |
| `resolving-merge-conflicts` | `skills/engineering/resolving-merge-conflicts/` | `3216582` (frozen: upstream deleted the skill in `daa01d8`) |
| `grill-with-docs` | `skills/engineering/grill-with-docs/` folded with `skills/productivity/grilling/` and `skills/engineering/domain-modeling/` | `49dd158` |
| `diagnosing-bugs` | `skills/engineering/diagnosing-bugs/` | `49dd158` |

To sync a fork, download the upstream files at the pinned commit and at the new one into a scratch directory outside this checkout, diff the two, port the changes that fit this repository's conventions, then update the pinned commit here and in the "Credits" table of `README.md`.

## Verification

Run these from the repository root before pushing.

Frontmatter, size, links and marketplace groups:

```bash
uv run --quiet --with pyyaml python3 - <<'PY'
import json, pathlib, re, sys
import yaml

ALLOWED = {"name", "description", "license", "compatibility", "metadata",
           "allowed-tools", "disable-model-invocation"}
NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
LINK = re.compile(r"\]\(([^)\s]+)\)")
errors = []
skills = sorted(pathlib.Path("skills").glob("*/*/SKILL.md"))
for md in skills:
    text = md.read_text()
    head, sep, _ = text.removeprefix("---\n").partition("\n---\n")
    if not text.startswith("---\n") or not sep:
        errors.append(f"{md}: no frontmatter")
        continue
    try:
        fm = yaml.safe_load(head)
    except yaml.YAMLError as error:
        errors.append(f"{md}: invalid YAML: {error}")
        continue
    meta = fm.get("metadata") or {}
    description = fm.get("description")
    checks = {
        "unexpected keys " + ", ".join(sorted(set(fm) - ALLOWED)): not set(fm) - ALLOWED,
        "name must equal the folder name": fm.get("name") == md.parent.name
        and bool(NAME.fullmatch(str(fm.get("name")))),
        "description must be one line of 1 to 1024 characters": isinstance(description, str)
        and 1 <= len(description) <= 1024 and "\n" not in description,
        "license must be MIT": fm.get("license") == "MIT",
        "metadata values must be strings": all(isinstance(v, str) for v in meta.values()),
        "metadata needs rogs-skills/contract": "rogs-skills/contract" in meta,
        "invocation keys must pair up": (fm.get("disable-model-invocation") is True)
        == (meta.get("opencode/autoinvoke") == "false"),
        "SKILL.md must stay under 500 lines": text.count("\n") < 500,
    }
    errors += [f"{md}: {message}" for message, ok in checks.items() if not ok]
for md in sorted(pathlib.Path("skills").rglob("*.md")):
    text = re.sub(r"`[^`\n]*`", "", re.sub(r"```.*?```", "", md.read_text(), flags=re.S))
    root = next((p for p in (md.parent, *md.parents) if (p / "SKILL.md").exists()), None)
    for target in LINK.findall(text):
        if re.match(r"[a-z]+:", target) or target.startswith("#"):
            continue
        path = (md.parent / target.split("#")[0]).resolve()
        if not path.exists():
            errors.append(f"{md}: broken link {target}")
        elif root and root.resolve() not in (path, *path.parents):
            errors.append(f"{md}: link leaves its skill folder: {target}")
manifest = json.loads(pathlib.Path(".claude-plugin/marketplace.json").read_text())
grouped = [(plugin["name"], path) for plugin in manifest["plugins"] for path in plugin["skills"]]
expected = {f"./{md.parent}": md.parent.parent.name for md in skills}
for plugin, path in grouped:
    if expected.get(path) != plugin:
        errors.append(f"marketplace.json: {path} does not belong in plugin {plugin}")
for path in expected.keys() - {path for _, path in grouped}:
    errors.append(f"marketplace.json: {path} is missing")
if len(grouped) != len({path for _, path in grouped}):
    errors.append("marketplace.json: a skill is listed twice")
print("\n".join(errors) or f"OK: {len(skills)} skills")
sys.exit(1 if errors else 0)
PY
```

Dashes (prints nothing when clean):

```bash
grep -rnP '[\x{2013}\x{2014}]' --exclude-dir=.git .
```

Agnosticism (prints only the built-in guides, the two allowed setup files, and `commit/references/git-edge-cases.md` for its sources; tool names are matched as proper nouns so ordinary words like "linear" pass):

```bash
grep -rlE '\bLinear\b|\bKaneo\b|GitHub|Gitea|GitLab|\bgh |\btea |\bglab |mcp__' skills
```

Discovery (lists every skill exactly once, under the headers Engineering, Lifecycle and Writing):

```bash
npx skills@latest add "$PWD" --list
```

Before pushing, also search the whole tree for the names of any client, employer or private project you work with. Keep that list of names outside this repository.
