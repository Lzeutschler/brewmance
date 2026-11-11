import { expect, test, type Page } from "@playwright/test";

// End to end: choose a commander, swipe, finish in the editor, export, then goldfish the deck.
// Needs network access, since card suggestions come from EDHREC and images from Scryfall.
test("build, export and goldfish a deck", async ({ page }) => {
  await page.goto("/build");
  await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
  await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
  await page.getByRole("button", { name: "Start swiping" }).click();

  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
  }
  await expect(page.getByTestId("picked-count")).toHaveText("20/99");

  await page.getByRole("button", { name: "Auto-complete & edit" }).click();
  await expect(page.getByText("Deck size is legal")).toBeVisible();

  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.getByRole("dialog").locator("textarea")).toHaveValue(/^Commander\n1 Krenko, Mob Boss\n\nDeck\n/);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Goldfish" }).click();
  await page.getByRole("button", { name: "Keep 7" }).click();
  const hand = page.locator("[data-zone=hand] [data-card-name]");
  await expect(hand).toHaveCount(7);
  await page.keyboard.press("d");
  await expect(hand).toHaveCount(8);
  await expect(page.getByTestId("turn")).toHaveText("1");
});

// Deck settings: set a budget before starting, then change the land count while swiping.
test("adjust deck settings before and while swiping", async ({ page }) => {
  await page.goto("/build");
  await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
  await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
  await page.getByRole("button", { name: "Advanced settings" }).click();
  const budget = page.getByRole("group", { name: "Budget per card" });
  await budget.getByRole("button", { name: "$5", exact: true }).click();
  await expect(budget.getByRole("button", { name: "$5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Start swiping" }).click();

  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  const landsCounter = page.getByText(/^Lands 0\/\d+$/);
  const lands = Number((await landsCounter.textContent())!.split("/")[1]);

  await page.getByRole("button", { name: "Deck settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("group", { name: "Budget per card" }).getByRole("button", { name: "$5", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dialog.getByRole("button", { name: "More lands" }).click();
  await expect(landsCounter).toHaveText(`Lands 0/${lands + 1}`);

  await dialog.getByRole("button", { name: "Reset to recommendation" }).click();
  await expect(landsCounter).toHaveText(`Lands 0/${lands}`);
  await page.keyboard.press("Escape");
  // Keys go to the dialog until its close animation ends, which a production build reaches faster than dev.
  await expect(dialog).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("picked-count")).toHaveText("1/99");
});

/** The advanced track with answers that leave plenty of white-black vampire commanders. */
async function answerAdvancedQuiz(page: Page) {
  await page.goto("/quiz");
  await page.getByRole("button", { name: /I know my way around/ }).click();
  await expect(page.getByTestId("quiz-progress")).toHaveText("1 / 7");

  // The newest card is the last one; the one before may still be flying off.
  const card = page.getByTestId("quiz-card").last();
  const swipe = async (id: string, answer: "Yes (→)" | "No (←)") => {
    await expect(card).toHaveAttribute("data-card", id);
    await page.getByRole("button", { name: answer }).click();
  };
  const pick = async (id: string, tiles: RegExp[]) => {
    await expect(card).toHaveAttribute("data-card", id);
    for (const tile of tiles) await card.getByRole("button", { name: tile }).click();
  };

  await swipe("win:army", "No (←)");
  await swipe("win:champion", "No (←)");
  await swipe("win:drain", "Yes (→)");
  for (const id of ["win:giants", "win:combo", "win:mill"]) await swipe(id, "No (←)");
  await pick("engine", [/The graveyard/]);
  await page.getByRole("button", { name: "Done (→)" }).click();
  // Draining the table makes punishing it the first table card.
  await swipe("table:punish", "Yes (→)");
  await expect(card).toHaveAttribute("data-card", "tempo");
  await page.getByRole("button", { name: /Build an engine/ }).click();
  await expect(card).toHaveAttribute("data-card", "complexity");
  await page.getByRole("button", { name: /Some decisions/ }).click();
  await pick("colors", [/White/, /Black/]);
  await card.getByRole("radio", { name: "2 colors" }).click();
  await page.getByRole("button", { name: "Done (→)" }).click();
  await swipe("tribe:gate", "Yes (→)");
  await pick("tribe", [/Vampires/]);
  await page.getByRole("button", { name: "Done (→)" }).click();

  await expect(page.getByRole("heading", { name: "It's a match!" })).toBeVisible();
  await page.getByRole("button", { name: "Meet your commanders" }).click({ timeout: 30_000 });
}

// Quiz: advanced track → commander swipe → shortlist → deckbuilding swipe.
test("find a commander with the quiz and start a deck", async ({ page }) => {
  await answerAdvancedQuiz(page);

  await expect(page.getByTestId("commander-count")).toHaveText("Commander 1 of 30", { timeout: 30_000 });
  await expect(page.getByTestId("fit-reasons").locator("li").first()).toBeVisible();
  for (const key of ["ArrowRight", "ArrowRight", "ArrowUp", "ArrowLeft"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(80);
  }
  await expect(page.getByTestId("commander-count")).toHaveText("Commander 5 of 30");
  await expect(page.getByTestId("shortlist-count")).toHaveText("3");

  await page.getByRole("button", { name: "Review shortlist" }).click();
  await expect(page.getByRole("heading", { name: "Your shortlist" })).toBeVisible();
  await page.getByRole("radio", { name: /Upgraded/ }).click();
  await page.getByRole("button", { name: "Start swiping" }).click();

  await expect(page).toHaveURL(/\/build\/[\w-]+$/);
  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Bracket 3/)).toBeVisible();
});

// Sharing: a link carries the deck to a fresh browser, which can open it in goldfish.
test("share a deck by link and goldfish it elsewhere", async ({ page, browser }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void ((window as unknown as { copied: string }).copied = text) },
    });
  });
  await page.goto("/build");
  await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
  await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
  await page.getByRole("button", { name: "Start swiping" }).click();
  await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(80);
  }
  await page.getByRole("button", { name: "Auto-complete & edit" }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  const link = await page.evaluate(() => (window as unknown as { copied: string }).copied);
  expect(link).toMatch(/\/d\/[\w-]+$/);

  const other = await browser.newPage();
  await other.goto(link);
  await expect(other.getByRole("heading", { name: "Krenko, Mob Boss" })).toBeVisible();
  await expect(other.getByText("100 cards")).toBeVisible();
  await other.getByRole("button", { name: "Goldfish this deck" }).click();
  await other.getByRole("button", { name: "Keep 7" }).click();
  await expect(other.locator("[data-zone=hand] [data-card-name]")).toHaveCount(7);
});

// Sharing a quiz result: the shortlist link opens the best match elsewhere, which can start that commander.
test("share a quiz shortlist and build its best match", async ({ page, browser }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => void ((window as unknown as { copied: string }).copied = text) },
    });
  });
  await answerAdvancedQuiz(page);
  await expect(page.getByTestId("commander-count")).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(80);
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Review shortlist" }).click();
  const top = (await page.getByRole("heading", { level: 2 }).first().textContent())!;

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  const link = await page.evaluate(() => (window as unknown as { copied: string }).copied);
  expect(link).toMatch(/\/q\/[\w-]+$/);

  const other = await browser.newPage();
  await other.goto(link);
  await expect(other.getByRole("heading", { level: 1, name: top })).toBeVisible();
  await expect(other.getByText(/\d+% match/).first()).toBeVisible();
  // The best match comes first; its "Build" button is a link styled as a button.
  await other.locator('a[href^="/build?commander="]').first().click();
  await expect(other.getByRole("heading", { level: 2, name: top })).toBeVisible({ timeout: 30_000 });
  await expect(other.getByRole("button", { name: "Start swiping" })).toBeEnabled({ timeout: 30_000 });
});

// On a phone: deck cards open by tap, and goldfish fits the screen with cards played by tap.
test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true });

  test("open cards by tap and goldfish on a small touch screen", async ({ page }) => {
    await page.goto("/build");
    await page.getByPlaceholder("Search commanders or creature types…").fill("krenko mob");
    await page.getByRole("button", { name: "Krenko, Mob Boss" }).click();
    await page.getByRole("button", { name: "Start swiping" }).click();
    await expect(page.getByText("cards picked")).toBeVisible({ timeout: 30_000 });
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(80);
    }
    await page.getByRole("button", { name: "Auto-complete & edit" }).click();

    // No hover on a phone: tapping a card in the list opens it big, with its actions.
    const firstCard = page.locator("main li > button").first();
    const name = (await firstCard.textContent())!.trim();
    await firstCard.tap();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Move to maybe" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();

    await page.getByRole("button", { name: "Goldfish" }).click();
    await page.getByRole("button", { name: "Keep 7" }).click();

    const hand = page.locator("[data-zone=hand] [data-card-name]");
    await expect(hand).toHaveCount(7);
    for (const name of ["Next turn", "Undo", "More"]) {
      const box = (await page.getByRole("button", { name, exact: true }).boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
    for (const box of await hand.evaluateAll((cards) => cards.map((c) => c.getBoundingClientRect().toJSON()))) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(390);
      expect(box.bottom).toBeLessThanOrEqual(664);
    }

    // The last card lies on top of the fan; the others are partly covered by their right neighbour.
    await hand.last().tap();
    await expect(hand).toHaveCount(6);
    await expect(page.locator("[data-zone=battlefield] [data-card-name]")).toHaveCount(1);
  });
});

// Upgrade swipe: open a precon, swap, pass and keep, then finish in the editor with 99 cards.
test("upgrade a precon by swiping", async ({ page }) => {
  await page.goto("/upgrade");
  await page.getByRole("textbox", { name: "Search precons" }).fill("virtue and valor");
  await page.getByRole("button", { name: /Virtue and Valor/ }).click();

  await expect(page.getByRole("heading", { name: "Upgrade Virtue and Valor" })).toBeVisible({ timeout: 30_000 });
  const budget = page.getByRole("group", { name: "Budget for the new cards" });
  await expect(budget.getByRole("button", { name: "$25", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Find swaps" }).click();

  const swapCount = page.getByTestId("swap-count");
  const cut = page.getByTestId("cut-name");
  await expect(swapCount).toHaveText("0", { timeout: 30_000 });
  await page.keyboard.press("ArrowRight");
  await expect(swapCount).toHaveText("1");

  // Keeping the card to cut offers another cut; passing leaves the deck alone.
  const firstCut = await cut.textContent();
  await page.keyboard.press("k");
  await expect(cut).not.toHaveText(firstCut!);
  await page.keyboard.press("ArrowLeft");
  await expect(swapCount).toHaveText("1");

  await page.keyboard.press("ArrowRight");
  await expect(swapCount).toHaveText("2");
  await page.keyboard.press("z");
  await expect(swapCount).toHaveText("1");

  await page.getByRole("button", { name: "Finish upgrade" }).click();
  await expect(page.getByTestId("upgrade-summary")).toContainText("1 swap,");
  await page.getByRole("button", { name: "Finish & open deck" }).click();
  await expect(page.getByText("Deck size is legal")).toBeVisible();
  await expect(page.getByRole("link", { name: "Upgrade", exact: true }).last()).toBeVisible();
});

// A precon page opens the same deck in the upgrade flow.
test("upgrade a precon from its page", async ({ page }) => {
  await page.goto("/precons/virtue-and-valor-woc");
  await expect(page.getByRole("heading", { level: 1, name: "Virtue and Valor" })).toBeVisible();
  await page.getByRole("button", { name: "Upgrade this deck" }).click();
  await expect(page.getByRole("heading", { name: "Upgrade Virtue and Valor" })).toBeVisible({ timeout: 30_000 });
});

// The color quiz runs to a result with the keyboard alone.
test("answer the color quiz", async ({ page }) => {
  await page.goto("/quiz/colors");
  const result = page.getByText("Your colors", { exact: true });
  for (let i = 0; i < 15 && !(await result.isVisible()); i++) {
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(250);
  }
  await expect(result).toBeVisible();
});
