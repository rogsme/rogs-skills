import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { renderMarkdown, renderPlan } from "../scripts/render_plan.mjs";

const runtime = process.env.PRESENT_PLAN_RUNTIME;
if (!runtime) throw new Error("Set PRESENT_PLAN_RUNTIME to the prepared runtime described in tests/README.md.");

async function fixture(t, name = "project") {
  const root = await mkdtemp(path.join(os.tmpdir(), "present-plan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repository = path.join(root, name);
  await mkdir(repository);
  execFileSync("git", ["init", "-q", "--initial-branch=ACM-123"], { cwd: repository });
  const source = path.join(root, "input.md");
  await writeFile(source, "# ACM-123: Add pagination\n\n## Goal\nKeep the existing response format.\n");
  return { root, source, repository, worktree: repository, artifactRoot: path.join(root, "artifacts"), runtime, ticket: "ACM-123" };
}

test("renders the full plan and review table without replacing the verdict", async (t) => {
  const options = await fixture(t);
  const markdown = "# ACM-123\n\n## Decision brief\nPreserve compatibility.\n\n" +
    "Plan review: reviewer (another vendor), verdict REVISE\n\n" +
    "| # | Finding | Decision | Plan change |\n|---|---|---|---|\n| 1 | Missing empty-page test | Accept | Add it |\n\n" +
    "## For you to decide\nKeep the documented retry policy.\n\n" +
    "## Verification\n- [ ] Empty pages remain compatible.\n- Run `npm test`.\n";
  await writeFile(options.source, markdown);
  const result = await renderPlan(options);
  assert.equal(await readFile(result.source, "utf8"), markdown);
  const html = await readFile(result.html, "utf8");
  assert.match(html, /<table>/);
  assert.match(html, /Missing empty-page test/);
  assert.match(html, /For you to decide/);
  assert.match(html, /verdict REVISE/);
  assert.doesNotMatch(html, /verdict SOUND/);
  assert.match(html, /Approval stays in your agent conversation/);
  assert.equal(result.revision, 1);
  assert.equal(result.sourceDigest.length, 64);
  assert.match(result.source, /revision-0001\.md$/);
  assert.match(html, new RegExp(result.sourceDigest));
});

test("keeps not-reviewed warnings visible and escapes executable content", async () => {
  const result = await renderMarkdown(
    "# Review\n\nNot reviewed: reviewer timed out.\n\n" +
    "<script>globalThis.pwned = true</script>\n\n" +
    "[unsafe](javascript:alert(1)) ![remote](https://example.com/tracker.png)\n\n" +
    "```js\nfetch('https://example.com/private')\n```\n", runtime,
  );
  assert.match(result.html, /review-warning/);
  assert.match(result.html, /Not reviewed: reviewer timed out/);
  assert.match(result.html, /&lt;script&gt;/);
  assert.doesNotMatch(result.html, /<script>|<img|href="javascript:/);
  assert.match(result.html, /tracker\.png/);
  assert.match(result.html, /fetch\(/);
});

test("supports nested lists, quotes, tables, entities, and safe links", async () => {
  const result = await renderMarkdown(
    "# AT&T\n\nAT&T &amp; Acme &copy; &rarr;.\n\n1. First\n   - Child **bold** and *emphasis*.\n\n" +
    "> Keep `API` stable.\n\n[reference](https://example.com/reference)\n\n---\n", runtime,
  );
  assert.match(result.html, /<ol/);
  assert.match(result.html, /<ul>/);
  assert.match(result.html, /<strong>bold<\/strong>/);
  assert.match(result.html, /<blockquote>/);
  assert.match(result.html, /AT&amp;T/);
  assert.doesNotMatch(result.html, /&amp;amp;/);
  assert.match(result.html, /&copy; &rarr;/);
  assert.match(result.html, /href="https:\/\/example.com\/reference"/);
  assert.match(result.html, /<hr>/);
});

test("keeps network-capable Mermaid source as text without giving it to Lavish", async () => {
  for (const diagram of [
    'flowchart LR\n  api@{ img: "https://example.com/tracker.png" }',
    '%%{init: {"securityLevel": "loose"}}%%\nflowchart LR\n  A --> B',
    'flowchart LR\n  A[API]\n  click A "https://example.com"',
  ]) {
    const result = await renderMarkdown("```mermaid\n" + diagram + "\n```\n", runtime);
    assert.equal(result.diagrams, 0);
    assert.doesNotMatch(result.html, /class="mermaid"/);
    assert.match(result.html, /local-only/);
    assert.match(result.html, /<pre><code>/);
  }
});

test("preserves old revisions and reuses one page only in its owned session", async (t) => {
  const options = await fixture(t);
  const first = await renderPlan(options);
  const before = await readFile(first.source, "utf8");
  await writeFile(options.source, before + "\n## Verification\nAdd the missing regression check.\n");
  const second = await renderPlan({ ...options, session: first.session });
  assert.equal(second.html, first.html);
  assert.equal(second.revision, 2);
  assert.notEqual(second.sourceDigest, first.sourceDigest);
  assert.equal(await readFile(first.source, "utf8"), before);
  const again = await renderPlan({ ...options, session: first.session });
  assert.equal(again.revision, 2);
  assert.equal(again.sourceDigest, second.sourceDigest);
});

test("separates simultaneous reviews and repositories with the same basename", async (t) => {
  const a = await fixture(t);
  const b = await fixture(t);
  const first = await renderPlan(a);
  const parallel = await renderPlan(a);
  const other = await renderPlan({ ...b, artifactRoot: a.artifactRoot });
  assert.notEqual(first.session, parallel.session);
  assert.notEqual(path.dirname(path.dirname(first.session)), path.dirname(path.dirname(other.session)));
  await assert.rejects(renderPlan({ ...b, artifactRoot: a.artifactRoot, session: first.session }), /identity|repository/i);
});

test("refuses output inside any checkout of the repository", async (t) => {
  const options = await fixture(t);
  await assert.rejects(renderPlan({ ...options, artifactRoot: path.join(options.repository, ".lavish") }), /outside.*checkout/i);
  execFileSync("git", ["-c", "user.name=Acme", "-c", "user.email=dev@example.com", "commit", "--allow-empty", "-qm", "Initial fixture"], { cwd: options.repository });
  const other = path.join(options.root, "ACM-124");
  execFileSync("git", ["worktree", "add", "-qb", "ACM-124", other], { cwd: options.repository });
  await assert.rejects(renderPlan({ ...options, artifactRoot: path.join(other, "plans") }), /outside.*checkout/i);
});

test("refuses symlinked output roots and modified owned files", async (t) => {
  const options = await fixture(t);
  const target = path.join(options.root, "target");
  await mkdir(target);
  const link = path.join(options.root, "linked-artifacts");
  await symlink(target, link, "dir");
  await assert.rejects(renderPlan({ ...options, artifactRoot: link }), /symlink/i);
  const first = await renderPlan(options);
  await writeFile(first.html, "Unrelated user edit");
  await assert.rejects(renderPlan({ ...options, session: first.session }), /modified|changed/i);
  assert.equal(await readFile(first.html, "utf8"), "Unrelated user edit");
});

test("refuses to adopt an unrelated directory or a changed bundle", async (t) => {
  const options = await fixture(t);
  await mkdir(options.artifactRoot);
  const unrelated = path.join(options.artifactRoot, "notes");
  await mkdir(unrelated);
  await writeFile(path.join(unrelated, "plan.html"), "Keep me");
  await assert.rejects(renderPlan({ ...options, session: unrelated }), /owned|session|manifest/i);
  const first = await renderPlan({ ...options, riders: ["ACM-124"] });
  await assert.rejects(renderPlan({ ...options, session: first.session, riders: ["ACM-125"] }), /identity|bundle/i);
});

test("copies a local classic Mermaid bundle for Lavish's opaque-origin sandbox", async (t) => {
  const options = await fixture(t);
  await writeFile(options.source, "# Architecture\n\n```mermaid\nflowchart LR\n  api[API] --> store[(Store)]\n```\n");
  const result = await renderPlan(options);
  const html = await readFile(result.html, "utf8");
  assert.match(html, /class="mermaid"/);
  assert.match(html, /api\[API\] --&gt; store/);
  assert.match(html, /src="assets\/diagrams\.js"/);
  assert.match(html, /src="assets\/mermaid\/mermaid\.min\.js"/);
  assert.doesNotMatch(html, /type="module"/);
  assert.doesNotMatch(html, /src="https?:|href="https?:.*\.css/);
  const files = await readdir(path.join(result.session, "assets", "mermaid"));
  assert.ok(files.includes("mermaid.min.js"));
  assert.ok(files.includes("LICENSE"));
  const bundle = await readFile(path.join(result.session, "assets", "mermaid", "mermaid.min.js"), "utf8");
  assert.doesNotMatch(bundle, /\bimport\s*\(/);
  const loader = await readFile(path.join(result.session, "assets", "diagrams.js"), "utf8");
  assert.match(loader, /securityLevel: "strict"/);
});

test("missing runtime and oversized sources fail before publication", async (t) => {
  const options = await fixture(t);
  await assert.rejects(renderPlan({ ...options, runtime: path.join(options.root, "missing") }), /runtime|marked|package/i);
  await writeFile(options.source, "x".repeat(1_048_577));
  await assert.rejects(renderPlan(options), /size|MiB|large/i);
});

test("rendering leaves the checkout and its index unchanged", async (t) => {
  const options = await fixture(t);
  await writeFile(path.join(options.repository, "pending.txt"), "User work\n");
  execFileSync("git", ["add", "--", "pending.txt"], { cwd: options.repository });
  await writeFile(path.join(options.repository, "pending.txt"), "More user work\n");
  const before = execFileSync("git", ["status", "--porcelain=v1", "-z"], { cwd: options.repository });
  const index = execFileSync("git", ["write-tree"], { cwd: options.repository });
  await renderPlan(options);
  assert.deepEqual(execFileSync("git", ["status", "--porcelain=v1", "-z"], { cwd: options.repository }), before);
  assert.deepEqual(execFileSync("git", ["write-tree"], { cwd: options.repository }), index);
  assert.equal(await readFile(path.join(options.repository, "pending.txt"), "utf8"), "More user work\n");
});
