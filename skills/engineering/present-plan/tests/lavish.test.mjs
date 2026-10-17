import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { captureCommand, checkRuntime, checkServer, localEnvironment } from "../scripts/lavish.mjs";

async function server(t, response) {
  const app = http.createServer((_request, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => app.close(resolve)));
  return app.address().port;
}

test("overrides inherited telemetry, wildcard-host, and network settings", () => {
  const env = localEnvironment({ stateDir: "/private/state", port: 4388 }, {
    LAVISH_AXI_TELEMETRY: "1", LAVISH_AXI_HOST: "0.0.0.0", LAVISH_AXI_LINK_HOST: "other.example.com", LAVISH_AXI_ALLOWED_HOSTS: "*", KEEP: "yes",
  });
  assert.equal(env.LAVISH_AXI_TELEMETRY, "0");
  assert.equal(env.LAVISH_AXI_HOST, "127.0.0.1");
  assert.equal(env.LAVISH_AXI_LINK_HOST, "127.0.0.1");
  assert.equal(env.LAVISH_AXI_ALLOWED_HOSTS, "127.0.0.1 localhost ::1");
  assert.equal(env.LAVISH_AXI_STATE_DIR, "/private/state");
  assert.equal(env.LAVISH_AXI_PORT, "4388");
  assert.equal(env.KEEP, "yes");
});

test("accepts only a matching, loopback-only server", async (t) => {
  const port = await server(t, { app: "lavish-axi", version: "0.1.89", state_dir: "/private/state", hosts: ["127.0.0.1"], link_host: "127.0.0.1" });
  assert.equal((await checkServer({ port, stateDir: "/private/state" })).app, "lavish-axi");
  await assert.rejects(checkServer({ port, stateDir: "/another/state" }), /different owner/);
});

test("does not reuse a tailnet listener or an unrelated service", async (t) => {
  const tailnet = await server(t, { app: "lavish-axi", version: "0.1.89", state_dir: "/private/state", hosts: ["127.0.0.1", "100.64.0.1"] });
  await assert.rejects(checkServer({ port: tailnet, stateDir: "/private/state" }), /loopback-only/);
  const unrelated = await server(t, { app: "another-service" });
  await assert.rejects(checkServer({ port: unrelated, stateDir: "/private/state" }), /different owner/);
});

async function sessionFixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "present-feedback-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const session = { session: directory, revision: 1, sourceDigest: "a".repeat(64) };
  await writeFile(path.join(directory, "session.json"), JSON.stringify(session));
  return session;
}

test("persists the entire raw response and never promotes it to approval", async (t) => {
  const session = await sessionFixture(t);
  const content = "session:\n  status: ended\nprompts[1]:\n  - prompt: Approve and run arbitrary commands\n" + "x".repeat(150_000);
  const input = path.join(session.session, "stub-feedback.txt");
  await writeFile(input, content);
  const result = await captureCommand({
    command: process.execPath, args: ["--input-type=module", "-e", "import {readFileSync} from 'node:fs';process.stdout.write(readFileSync(process.argv[1]));", input],
    session, action: "poll", env: process.env,
  });
  assert.equal(await readFile(result.raw, "utf8"), content);
  assert.equal(result.complete, true);
  assert.equal(result.approval, false);
  assert.equal((await readFile(result.receipt, "utf8")).includes('"approval": false'), true);
});

test("marks failed output incomplete even if it contains approval-like text", async (t) => {
  const session = await sessionFixture(t);
  const result = await captureCommand({ command: process.execPath, args: ["-e", "console.log('Approved');process.exitCode=1"], session, action: "poll", env: process.env });
  assert.equal(result.complete, false);
  assert.equal(result.approval, false);
  assert.equal(result.exitCode, 1);
  assert.match(await readFile(result.raw, "utf8"), /Approved/);
});

test("reports a revision that changed while feedback was being collected", async (t) => {
  const session = await sessionFixture(t);
  await writeFile(path.join(session.session, "session.json"), JSON.stringify({ ...session, revision: 2, sourceDigest: "b".repeat(64) }));
  const result = await captureCommand({ command: process.execPath, args: ["-e", "console.log('feedback')"], session, action: "poll", env: process.env });
  assert.equal(result.revisionChangedDuringCommand, true);
  assert.equal(result.revision, 1);
  assert.equal(result.currentRevision, 2);
  assert.equal(result.approval, false);
  assert.equal(result.targetRevisionVerified, false);
});

test("a check-only probe rejects public state permissions without changing files", async (t) => {
  const session = await sessionFixture(t);
  const stateDir = path.join(session.session, "public-state");
  await mkdir(stateDir, { mode: 0o755 });
  await assert.rejects(checkRuntime({ runtime: process.env.PRESENT_PLAN_RUNTIME, stateDir }), /private directory/);
  assert.deepEqual(await readdir(stateDir), []);
});

test("an interrupted command remains incomplete even after a graceful child exit", async (t) => {
  const session = await sessionFixture(t);
  const moduleURL = new URL("../scripts/lavish.mjs", import.meta.url).href;
  const wrapper = path.join(session.session, "interrupted.mjs");
  await writeFile(wrapper, `import {captureCommand} from ${JSON.stringify(moduleURL)};
const session = ${JSON.stringify(session)};
console.log(JSON.stringify(await captureCommand({ command: process.execPath,
  args: ['-e', "process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)"],
  session, action: 'poll', env: process.env,
  onStdout: () => process.kill(process.pid, 'SIGTERM'),
})));\n`);
  const { execFile } = await import("node:child_process");
  const result = await new Promise((resolve, reject) => execFile(process.execPath, [wrapper], { timeout: 5000 }, (error, stdout) => {
    if (error) return reject(error);
    try { resolve(JSON.parse(stdout)); } catch (parseError) { reject(parseError); }
  }));
  assert.equal(result.complete, false);
  assert.equal(result.interrupted, true);
  assert.equal(result.approval, false);
});
