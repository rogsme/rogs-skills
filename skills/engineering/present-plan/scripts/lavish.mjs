import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { lstat, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { VERSIONS, atomicWrite, externalDirectory, inspectRuntime, inside, loadSession, makePrivateDirectory, readJSON, safePath } from "./common.mjs";

const loopback = new Set(["127.0.0.1", "localhost", "::1"]);

export function localEnvironment(session, base = process.env) {
  return {
    ...base,
    LAVISH_AXI_TELEMETRY: "0",
    LAVISH_AXI_HOST: "127.0.0.1",
    LAVISH_AXI_LINK_HOST: "127.0.0.1",
    LAVISH_AXI_ALLOWED_HOSTS: "127.0.0.1 localhost ::1",
    LAVISH_AXI_STATE_DIR: session.stateDir,
    LAVISH_AXI_PORT: String(session.port),
  };
}

export async function checkServer({ port, stateDir }) {
  const health = await new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: "/health", timeout: 1500 }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
        if (body.length > 65_536) request.destroy(new Error("Unexpected server health response."));
      });
      response.on("error", reject);
      response.on("end", () => {
        if (response.statusCode !== 200) return reject(new Error("A server occupies the presenter port but is not ready; leave it untouched."));
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error("An unrelated server occupies the presenter port; leave it untouched.")); }
      });
    });
    request.on("timeout", () => request.destroy(new Error("Cannot verify presenter server ownership; leave the port untouched.")));
    request.on("error", (error) => error.code === "ECONNREFUSED" ? resolve(null) : reject(error));
  });
  if (health === null) return null;
  if (health.app !== "lavish-axi" || health.version !== VERSIONS["lavish-axi"] || health.state_dir !== stateDir) throw new Error("The existing server has a different owner, version, or state directory; choose another port, without stopping it.");
  if (!Array.isArray(health.hosts) || !health.hosts.length || health.hosts.some((host) => !loopback.has(host)) || (health.link_host && !loopback.has(health.link_host))) throw new Error("The existing presenter server is not loopback-only; use an isolated state directory and port.");
  return health;
}

export async function checkRuntime({ runtime, stateDir = path.join(runtime, "lavish-state"), port = 4388 }) {
  runtime = await inspectRuntime(await externalDirectory(runtime, []));
  stateDir = await externalDirectory(stateDir, []);
  port = Number(port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Use an unprivileged local port.");
  const cli = path.join(runtime, "node_modules", "lavish-axi", "dist", "cli.mjs");
  await safePath(cli);
  if (!(await stat(cli)).isFile()) throw new Error("The Lavish CLI is missing from the runtime.");
  const state = await lstat(stateDir).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
  if (state && (!state.isDirectory() || (state.mode & 0o077) !== 0)) throw new Error("Server state must be a private directory (mode 0700); leave existing permissions untouched and choose a private path.");
  await checkServer({ stateDir, port });
  return { runtime, stateDir, port, cli, versions: VERSIONS, status: "ready", browserOpened: false };
}

export async function captureCommand({ command, args, session, action, env, onStderr = () => {}, onStdout = () => {} }) {
  const token = randomUUID();
  const raw = path.join(session.session, `${action}-${token}.txt`);
  const receipt = path.join(session.session, `${action}-${token}.json`);
  const output = createWriteStream(raw, { flags: "wx", mode: 0o600 });
  await new Promise((resolve, reject) => { output.once("open", resolve); output.once("error", reject); });
  let child;
  let interruptedBy = null;
  const signalHandlers = {};
  const exit = await new Promise((resolve, reject) => {
    child = spawn(command, args, { cwd: session.session, env, stdio: ["ignore", "pipe", "pipe"] });
    for (const signal of ["SIGINT", "SIGTERM"]) {
      signalHandlers[signal] = () => { interruptedBy = signal; child.kill(signal); };
      process.on(signal, signalHandlers[signal]);
    }
    child.stdout.pipe(output);
    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    output.on("error", (error) => { child.kill("SIGTERM"); reject(error); });
    child.on("error", (error) => { output.end(); reject(error); });
    child.on("close", (code, signal) => resolve({ code, signal }));
  }).finally(() => {
    for (const [signal, handler] of Object.entries(signalHandlers)) process.off(signal, handler);
  });
  if (!output.writableFinished) await new Promise((resolve, reject) => { output.once("finish", resolve); output.once("error", reject); });
  const current = await readJSON(path.join(session.session, "session.json"));
  const result = {
    action, raw, receipt, revision: session.revision, sourceDigest: session.sourceDigest,
    currentRevision: current.revision, currentSourceDigest: current.sourceDigest,
    revisionChangedDuringCommand: session.sourceDigest !== current.sourceDigest,
    targetRevisionVerified: false,
    complete: exit.code === 0 && !exit.signal && !interruptedBy, exitCode: exit.code, signal: exit.signal,
    interrupted: Boolean(interruptedBy), interruptedBy,
    approval: false,
  };
  await atomicWrite(receipt, JSON.stringify(result, null, 2) + "\n", { exclusive: true });
  return result;
}

export async function runLavish(action, options) {
  if (!["open", "poll", "reply", "end"].includes(action)) throw new Error("Only open, poll, reply, and end are supported; sharing, installation, and server-wide stop are not exposed.");
  const session = await loadSession(options.session);
  const runtime = await checkRuntime(session);
  await makePrivateDirectory(session.stateDir);
  await checkRuntime(session);
  const args = [runtime.cli];
  if (action !== "open") args.push(action);
  args.push(path.join(session.session, "plan.html"));
  if (options.noOpen && action === "open") args.push("--no-open");
  if (options.reopen && action === "open") args.push("--reopen");
  if (action === "poll") args.push("--owner", `present-plan:r${session.revision}:${session.sourceDigest.slice(0, 12)}`);
  if (action === "reply") {
    const reply = await safePath(options.replyFile);
    if (!inside(session.session, reply)) throw new Error("Keep the reply file in this review's private directory.");
    args.push("--agent-reply-file", reply);
  }
  const result = await captureCommand({
    command: process.execPath, args, session, action,
    env: localEnvironment(session), onStderr: (chunk) => process.stderr.write(chunk),
  });
  if (result.complete) await checkServer(session);
  return result;
}

function argumentsFor(argv) {
  const options = {};
  const fields = { "--runtime": "runtime", "--state-dir": "stateDir", "--port": "port", "--session": "session", "--reply-file": "replyFile" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--no-open") options.noOpen = true;
    else if (argv[i] === "--reopen") options.reopen = true;
    else if (fields[argv[i]] && argv[i + 1]) options[fields[argv[i]]] = argv[++i];
    else throw new Error(`Unknown or incomplete argument: ${argv[i]}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("node lavish.mjs check --runtime <tool-cache> [--state-dir <directory>] [--port <port>]\nnode lavish.mjs <open|poll|reply|end> --session <owned-review-directory> [--no-open] [--reopen] [--reply-file <file-in-review-directory>]\nRead the complete raw output named by the receipt. A completed command is never plan approval.");
  } else {
    try {
      const [action, ...args] = process.argv.slice(2);
      const options = argumentsFor(args);
      const result = action === "check" ? await checkRuntime(options) : await runLavish(action, options);
      console.log(JSON.stringify(result, null, 2));
      if (result.complete === false) process.exitCode = result.exitCode || 1;
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
