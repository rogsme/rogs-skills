# Open or reuse the pull request

Every command comes from `docs/agents/forge.md`. Publish at most once, verify every field, and repair a pull request in place instead of opening a second one.

## Before publishing

1. Record the branch, the `HEAD` commit, and the destination: the host, repository, remote and base from `## Forge`. Name them explicitly in every call; never rely on ambient CLI defaults. Stop on a detached or unborn `HEAD`, or with a merge, rebase or cherry-pick in progress.
2. Confirm the CLI is authenticated for the host, without printing tokens. A failure is `Status: BLOCKED`.
3. Fetch the base and require it to be an ancestor of `HEAD`. Otherwise sync first, as step 4 of the skill describes.
4. Run `find-pr` for the exact head repository, head branch and base. When a pull request exists, reuse it: refresh its body with `edit-pr` when it is out of date, showing the diff first when someone else edited it meanwhile. Never create a duplicate.
5. Screen the changed paths in `<base>...HEAD` for secrets, credentials and private data before anything leaves the machine, and block publication on a hit.
6. When `## Pull requests` names an assignee, check eligibility with `assign` before publishing. An ineligible assignee is `Status: BLOCKED`, never a silent omission or a substitute account. With `Assignee: none`, assign nobody.
7. `push` the branch and confirm the remote branch points at `HEAD`.

## The body

- Read the body format from the base branch on the remote, not from the worktree: the template `## Pull requests` names, or `docs/agents/pull-request.md` without its marker line.
- Keep the template's headings, order and checklists. Replace every prompt with a factual answer. Check a box only with evidence for exactly what it asserts, and leave human certifications such as approvals or sign-offs for a human.
- Add each required heading the template lacks.
- Reference tickets plainly. Never use closing keywords: only `finish-ticket` completes tickets.
- Write the body to a private temporary file outside the repository with a quoted heredoc, so backticks, dollar signs and quotes reach the forge unchanged. Delete only temporary files you created.

## Publish once

1. Run `find-pr` again immediately before creating. A pull request that appeared in the meantime is reused, unchanged.
2. `create-pr` with the explicit repository, base, head, title (every ticket id first, lead first) and the body file. Never use an editor, a form, a browser, or an option that fills the body from commit messages. A dry run that still pushes is not a preview.
3. `read-pr` and verify the destination, the head repository, branch and SHA, the base, the title, the body, the draft state (not a draft unless the user asked) and the assignees.
4. When `create-pr` exited with an error but printed a URL, or the assignee is missing, repair that same pull request: add the assignee with `assign` without removing anyone, then read it back again. When the outcome cannot be determined, stop with the exact partial state instead of retrying blindly.
