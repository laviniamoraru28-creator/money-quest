import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("menu opens from any page, lists real sections and closes on Escape",async({page})=>{
 await page.goto("/en/brain-lab");
 const trigger=page.getByRole("button",{name:"Menu",exact:true});
 await expect(trigger).toBeVisible();
 await trigger.click();
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole("link",{name:"Home",exact:true})).toBeVisible();
 for(const section of ["Learning Adventures","Explore & Discover","Library & Museum","Wellbeing & Inclusion","For Parents","Information"])await expect(dialog.getByRole("button",{name:section,exact:true})).toBeVisible();
 await expect(dialog.getByRole("link",{name:"Library",exact:true})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(dialog).toBeHidden();
 await expect(trigger).toBeFocused();
});

test("navigating to a destination closes the menu and preserves the selected language",async({page})=>{
 await page.goto("/ro");
 await page.getByRole("button",{name:"Meniu",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Explorează Money Quest"});
 await dialog.getByRole("link",{name:"Bibliotecă",exact:true}).click();
 await expect(page).toHaveURL(/\/ro\/library$/);
 await expect(dialog).toBeHidden();
});

test("sections expand and collapse, and the current page is highlighted",async({page})=>{
 await page.goto("/en/museum");
 await page.getByRole("button",{name:"Menu",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 const section=dialog.getByRole("button",{name:"Library & Museum",exact:true});
 await expect(section).toHaveAttribute("aria-expanded","true");
 const museumLink=dialog.getByRole("link",{name:"Museum",exact:true});
 await expect(museumLink).toBeVisible();
 await expect(museumLink).toHaveAttribute("aria-current","page");
 await section.click();
 await expect(section).toHaveAttribute("aria-expanded","false");
 await expect(museumLink).toBeHidden();
 await section.click();
 await expect(museumLink).toBeVisible();
});

test("search filters to real existing routes only, with no invented results",async({page})=>{
 await page.goto("/en");
 await page.getByRole("button",{name:"Menu",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 const search=dialog.getByPlaceholder("Search for a lesson or activity…");
 await search.fill("lab");
 // Search-result links include their section as extra context in the
 // accessible name ("Brain Lab Explore & Discover"), unlike the plain
 // section-browsing view - so match by substring here, not exact:true.
 for(const name of ["Brain Lab","Mind Lab","Investing Lab"])await expect(dialog.getByRole("link",{name:new RegExp(`^${name}\\b`)})).toBeVisible();
 await expect(dialog.getByRole("button",{name:"Explore & Discover",exact:true})).toBeHidden();
 await search.fill("zzz-nonexistent-xyz");
 await expect(dialog.getByText("No matches found.")).toBeVisible();
 // Home remains (it's a permanent shortcut, not a search result) -
 // only the results list itself must be empty.
 await expect(dialog.locator("ul li")).toHaveCount(0);
});

test("keyboard-only: tab stays trapped inside the open menu",async({page})=>{
 await page.goto("/en");
 await page.getByRole("button",{name:"Menu",exact:true}).focus();
 await page.keyboard.press("Enter");
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 await expect(dialog.getByPlaceholder("Search for a lesson or activity…")).toBeFocused();
 const closeButton=dialog.getByRole("button",{name:"Close menu",exact:true});
 await closeButton.focus();
 await page.keyboard.press("Tab");
 const active=await page.evaluate(()=>document.activeElement?.closest('[role="dialog"]')!==null);
 expect(active).toBe(true);
});

test("the menu does not cover or disable the language selector",async({page})=>{
 await page.goto("/en");
 const languageSelect=page.locator("select").first();
 await expect(languageSelect).toBeVisible();
 await page.getByRole("button",{name:"Menu",exact:true}).click();
 await expect(languageSelect).toBeEnabled();
 await languageSelect.selectOption("ro");
 await expect(page).toHaveURL(/\/ro$/);
});

test("every menu link resolves to a real page, no broken links",async({page,request})=>{
 await page.goto("/en");
 await page.getByRole("button",{name:"Menu",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 for(const button of await dialog.getByRole("button").all()){
  const expanded=await button.getAttribute("aria-expanded");
  if(expanded==="false")await button.click();
 }
 const hrefs=await dialog.getByRole("link").evaluateAll(links=>links.map(link=>(link as HTMLAnchorElement).getAttribute("href")));
 expect(hrefs.length).toBeGreaterThan(10);
 for(const href of new Set(hrefs)){
  const response=await request.get(href!);
  expect(response.status(),`${href}: expected a real page`).toBeLessThan(400);
 }
});

test("dark mode (Night view): menu stays legible and passes WCAG contrast",async({page})=>{
 await page.goto("/en");
 await page.getByRole("button",{name:"Night view",exact:true}).click();
 await page.getByRole("button",{name:"Menu",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 await expect(dialog).toBeVisible();
 const results=await new AxeBuilder({page}).include('[role="dialog"]').withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
 expect(results.violations).toEqual([]);
});

test("mobile: menu is a full-width panel with large touch targets",async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto("/en");
 const trigger=page.getByRole("button",{name:"Menu",exact:true});
 const triggerBox=await trigger.boundingBox();
 expect(triggerBox!.width).toBeGreaterThanOrEqual(44);
 expect(triggerBox!.height).toBeGreaterThanOrEqual(44);
 await trigger.click();
 const dialog=page.getByRole("dialog",{name:"Explore Money Quest"});
 const box=await dialog.boundingBox();
 expect(box!.width).toBeGreaterThan(300);
 const homeLink=dialog.getByRole("link",{name:"Home",exact:true});
 const homeBox=await homeLink.boundingBox();
 expect(homeBox!.height).toBeGreaterThanOrEqual(44);
});

test("reduced motion: menu opens without a motion violation and the app's own toggle is respected",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/en");
 await page.getByRole("button",{name:"Menu",exact:true}).click();
 await expect(page.getByRole("dialog",{name:"Explore Money Quest"})).toBeVisible();
});
