# Presenter verification

Tests use synthetic plans and disposable repositories outside this checkout. They never use a real tracker or forge. The runtime is a separate private directory; no skill is installed into this checkout.

## Runtime

With explicit permission to install test dependencies, use the command in `references/lavish.md` to prepare a runtime. Set `PRESENT_PLAN_RUNTIME` to its absolute path. Set `TMPDIR` to an approved scratch directory when the default is not appropriate.

From the repository root:

```sh
node --test skills/engineering/present-plan/tests/*.test.mjs
```

The rendering tests need the prepared runtime and fail clearly when it is missing. They exercise the real pinned Markdown lexer. Diagram tests require a local classic bundle with no dynamic module imports, because ES modules fail CORS in Lavish's opaque-origin iframe. Protocol tests use disposable HTTP services and command stubs; their success does not prove real browser interaction.

## Browser integration

With the same runtime and the `playwright-cli` command available:

```sh
node skills/engineering/present-plan/tests/browser.mjs
```

The integration test creates its own private state, free local port, scratch repository, review artifacts and named browser session. It opens no personal browser profile. It verifies rendered sections and safety, blocks non-local browser requests, sends anchored feedback and a whiteboard edit through a real Lavish poll, checks live revision reload, and ends only its own sessions. Test-generated files stay in its scratch directory. A failed browser or missing dependency is a failure, never an inferred pass.

## Agent scenarios and human acceptance

`evals/evals.json` describes agent behavior; the unit tests do not certify it. Run the scenarios with and without the new skill in a disposable environment, using stubbed tracker/reviewer operations, and save transcripts outside the checkout. Check review-before-presentation ordering, complete failure fallback, stale feedback, and the separate approval/implementation boundary. Do not claim these scenarios passed from reading the prompts alone.

Then try one small and one architecture-heavy real plan on a configured project. Send an annotation, edit a diagram, request a substantive plan revision and verify the new adversarial round. End the browser review and confirm implementation still waits for explicit conversation approval and a separate work phase. This manual trial is not performed by the automated tests.
