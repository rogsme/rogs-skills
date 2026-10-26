async (page) => {
  const config = __CONFIG__;
  // The open tab reloads itself on the new revision and shows the agent's answers.
  await page.waitForFunction((revision) => document.documentElement.dataset.planRevision === String(revision), config.revision, { timeout: 30_000 });
  await page.getByRole("heading", { name: "Revision check", exact: true, includeHidden: true }).waitFor({ state: "attached" });
  if (await page.evaluate(() => document.documentElement.dataset.theme) !== "dark") throw new Error("The reloaded page lost the dark theme.");
  // This browser saw revision 1 and the tab has no focus, so revision 2 marks the title until it gets focus.
  const seen = () => page.evaluate(() => ({ title: document.title, seen: localStorage.getItem(`present-plan:${location.pathname}:seen`) }));
  const arrived = await seen();
  if (arrived.title !== "(new) ACM-123 | Plan review" || arrived.seen !== String(config.revision - 1)) throw new Error(`Revision ${config.revision} did not mark the title: ${JSON.stringify(arrived)}`);
  await page.evaluate(() => dispatchEvent(new Event("focus")));
  const acknowledged = await seen();
  if (acknowledged.title.startsWith("(new) ") || acknowledged.seen !== String(config.revision)) throw new Error(`Focus did not acknowledge the revision: ${JSON.stringify(acknowledged)}`);
  await page.keyboard.press("c");
  await page.locator(".pp-answer").filter({ hasText: "Changed" }).first().waitFor();
  await page.locator(".pp-answer").filter({ hasText: "Kept" }).first().waitFor();
  await page.keyboard.press("Escape");

  // Another review on the same server opens in the saved theme.
  const other = await page.context().newPage();
  await other.goto(config.otherUrl);
  await other.getByRole("heading", { name: "ACM-124: Export", exact: true }).waitFor();
  if (await other.evaluate(() => document.documentElement.dataset.theme) !== "dark") throw new Error("The second review did not open in the saved theme.");
  await other.close();

  const approve = page.locator("#pp-approve");
  await page.waitForFunction(() => !document.querySelector("#pp-approve").disabled, null, { timeout: 15_000 });
  await approve.click();
  await page.getByRole("dialog").getByText(`Approve revision ${config.revision} and start work-ticket?`).waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  await page.locator("#pp-banner.approved").waitFor();
  if (!(await page.locator("#pp-comment").isDisabled())) throw new Error("Comments stayed open after approval.");
  const external = page.__presentPlanExternal || [];
  if (external.length) throw new Error(`External requests: ${external.join(", ")}`);
  return { passed: true, revision: config.revision, approved: true, attention: { arrived, acknowledged } };
}
