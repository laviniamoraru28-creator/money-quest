import {expect, test} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import messages from "../../messages/en.json";
import {AGENCY_MISSIONS} from "../../src/lib/agency/missions";
import {availableChoices, decide, startMission} from "../../src/lib/agency/engine";
import {createDefaultState} from "../../src/lib/local-progress/state";

const hubs = {money:"play", entrepreneur:"entrepreneur-quest", leadership:"leadership-quest", ai:"ai-quest"};
for (const mission of Object.values(AGENCY_MISSIONS)) {
  test(`${mission.id}: enter from the hub, make decisions, resume and recover`, async ({page}) => {
    const text = messages.agency.missions[mission.id as keyof typeof messages.agency.missions];
    const labels: Record<string,string> = text.choices;
    const nodes: Record<string,{prompt:string}> = text.nodes;
    await page.addInitScript(state => {
      if (!localStorage.getItem("moneyquest_local_progress_v1")) {
        localStorage.setItem("moneyquest_local_progress_v1", JSON.stringify(state));
      }
    }, {...createDefaultState(), ageBand:mission.band});
    await page.goto(`/en/${hubs[mission.quest]}`);
    await page.getByRole("link",{name:text.title,exact:true}).click();
    const main = page.getByRole("main");
    await expect(main.getByRole("heading",{name:text.title})).toBeVisible();
    let state = startMission(mission);
    for (let step = 0; step < 20 && state.status !== "completed"; step++) {
      await expect(main.getByText(nodes[state.currentNodeId]!.prompt,{exact:true})).toBeVisible();
      const choice = availableChoices(mission,state).find(option =>
        option.affordable && decide(mission,state,option.id).status !== "recovering");
      expect(choice).toBeDefined();
      await main.getByRole("button",{name:labels[choice!.id],exact:true}).press("Enter");
      state = decide(mission,state,choice!.id);
      if (step === 0) {
        await expect(main.getByText(nodes[state.currentNodeId]!.prompt,{exact:true})).toBeVisible();
        await page.reload();
      }
    }
    expect(state.status).toBe("completed");
    await expect(main.getByRole("heading",{name:messages.agency.statusCompletedHeading})).toBeVisible();
    await expect(main.getByRole("listitem").first()).toBeVisible();
    await page.reload();
    await main.getByRole("button",{name:messages.agency.restartButton}).click();
    await main.getByRole("button",{name:messages.agency.askForHelpButton}).click();
    await expect(main.getByText(messages.agency.recoveryBadge,{exact:true})).toBeVisible();
    const recovery = mission.nodes[mission.recoveryNodeId!]!.choices[0]!;
    await main.getByRole("button",{name:labels[recovery.id],exact:true}).press("Enter");
    await expect(main.getByRole("heading",{name:messages.agency.statusCompletedHeading})).toBeVisible();
    const scan = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    expect(scan.violations).toEqual([]);
  });
}
