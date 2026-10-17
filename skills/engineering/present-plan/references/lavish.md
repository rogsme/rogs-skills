# Lavish runtime and review protocol

Use Node.js 22+ and the versions `scripts/common.mjs` checks. No upstream Lavish skill, global hook, agent plugin or MCP server is needed. Runtime preparation is a separate user-approved action, never part of presenting a plan or running setup's check mode.

## Prepare once, outside the repository

Choose an absolute private runtime path, an allowed external artifact root, and a private state directory. On systems with an XDG cache directory, a versioned directory below it is suitable for the runtime. A planning agent may have a narrower allowed artifact path: respect it. Do not install into any checkout.

After explicit installation approval:

```sh
npm install --prefix "<runtime>" --ignore-scripts --save-exact --no-audit --no-fund lavish-axi@0.1.89 marked@18.1.0 mermaid@11.12.1
```

Keep the resulting lockfile in that runtime directory. The presentation scripts never run npm, resolve `latest`, upgrade packages or install skills. Runtime upgrades are explicit and require repeating the tests; update the checked versions and this recipe together.

Choose a stable unprivileged local port, initially `4388` when free. Do not take over another service. All sessions using one runtime can share its private state/port. Record the runtime, artifact root, state directory and port under `## Plan presentation` when using the lifecycle.

Check without opening a browser:

```sh
node "<skill-dir>/scripts/lavish.mjs" check --runtime "<runtime>" --state-dir "<state-dir>" --port 4388
```

The check verifies Node, package versions, the CLI entrypoint, private permissions on existing server state, and any already-running server. It creates no review and starts no server. A new state directory is created with mode 0700 when a review opens. Existing permissions stay untouched: choose a private path when the check rejects them. Browser launch and diagram rendering require the browser pass in `tests/README.md`.

## Render

The input is the complete settled report, including all required investigation details, every ticket's criteria, diagrams already considered during review, and the review table or warning.

```sh
node "<skill-dir>/scripts/render_plan.mjs" --source "<report.md>" --repository "<main-checkout>" --worktree "<ticket-checkout>" --ticket "ACM-123" --artifacts "<artifact-root>" --runtime "<runtime>" --state-dir "<state-dir>" --port 4388
```

Repeat `--rider "ACM-124"` for every rider. For a standalone document, use a short name instead of a ticket and the same root for repository/worktree outside Git. Use `--title` only for a display title, not a second summary.

The renderer returns JSON with `session`, `html`, `source`, `revision` and `sourceDigest`. Revisions of this review pass `--session "<returned-directory>"` with the same identity and runtime settings. New source content creates an immutable Markdown snapshot; the current page stays at `plan.html`. Unchanged content keeps its revision. Never replace an unrelated file or remove a render lock: an interrupted render needs inspection, not an assumed successful retry.

The renderer loads Marked from the prepared runtime and only emits its own safe HTML elements. Images are references, not loads. Mermaid's self-contained classic browser bundle and license are copied beside the page, so no CDN is needed. Use classic scripts: Lavish's iframe has an opaque origin, and its local asset routes do not supply the CORS headers that ES modules need. Keep the sandbox intact. Raw source, review history and feedback may contain private code: treat the whole artifact directory as sensitive and retain it until the user requests cleanup.

The page adds a local-only content policy. Mermaid sources that contain network references, image/icon resources or configuration directives stay escaped as source with a warning, rather than entering either the renderer or Lavish's separate whiteboard importer. This conservative boundary can also flag a URL used only as a label; preserve it as text for review.

## Open, poll, reply, end

```sh
node "<skill-dir>/scripts/lavish.mjs" open --session "<session>"
node "<skill-dir>/scripts/lavish.mjs" poll --session "<session>"
node "<skill-dir>/scripts/lavish.mjs" reply --session "<session>" --reply-file "<session>/reply.md"
node "<skill-dir>/scripts/lavish.mjs" end --session "<session>"
```

For an automated test or a user who does not want an automatic browser launch, `open` accepts `--no-open`. A user-requested reopening accepts `--reopen`. No action installs hooks or calls the upstream `setup` command.

Each action returns a receipt naming a raw native-output file. Read that complete file. Lavish currently writes TOON, not a supported `--json` stream; the wrapper deliberately stores it without parsing or truncating it. Its `complete` field describes the command, not the user's decision. `approval` is always false. When collection spans a render, `revisionChangedDuringCommand` is true and the caller must reconcile the feedback against the named snapshots. These fields identify polling context, not the target of every delayed native comment: `targetRevisionVerified` stays false. Compare anchors and snapshots, and ask when the target revision remains unclear.

Lavish's `queuePrompt()` preserves `prompt`, `tag` and supported target fields. Custom `options.data` becomes JSON appended to the prompt string under `Context data:`; it is not a separate structured decision field. Ordinary annotations are sufficient here. Browser controls do not implement the lifecycle's approval gate.

`poll` waits indefinitely. Use the agent's supported foreground or background-completion mechanism, without adding the upstream test-only timeout flag. If a background task cannot resume the agent, give the URL without claiming monitoring and retrieve feedback when the human returns. The wrapper forwards interruption to its child and preserves complete or partial output. Never interpret a timeout or nonzero exit as consent.

## Local-only boundary

Every action forces `LAVISH_AXI_TELEMETRY=0`, `LAVISH_AXI_HOST=127.0.0.1`, `LAVISH_AXI_LINK_HOST=127.0.0.1`, the private state/port, and a loopback Host allowlist. These override inherited settings. The wrapper checks the existing server's application, exact version, state directory and listeners before invoking the CLI. It rejects unknown, non-loopback or other-owner services rather than stopping or upgrading them.

Lavish otherwise automatically adds a Tailscale listener when available. Setting an environment variable does not remove a listener from an existing server. Use another configured private state/port when reuse is unsafe. The server has no authentication; never expose it to a network.

The wrapper offers no `share`, `setup`, `update`, or `stop`. Lavish still displays its own Publish control; do not use it for private plans. Hosted sharing uploads to a third party and is public by default. This wrapper does not remove that upstream UI or provide network isolation. End only a review owned by this call. Do not stop a shared server or delete saved reviews without authorization.

## Sources

Checked against Lavish `0.1.89` on 2026-10-17:

- [CLI, feedback, privacy and sharing](https://github.com/kunchenguid/lavish-axi/blob/lavish-axi-v0.1.89/README.md)
- [Feedback data encoding](https://github.com/kunchenguid/lavish-axi/blob/lavish-axi-v0.1.89/src/artifact-sdk.js)
- [Local server and whiteboard invariants](https://github.com/kunchenguid/lavish-axi/blob/lavish-axi-v0.1.89/docs/invariants.md)
- [Marked token and renderer documentation](https://marked.js.org/using_pro)
