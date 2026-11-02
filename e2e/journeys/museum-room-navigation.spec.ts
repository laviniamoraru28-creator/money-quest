import {test,expect} from "@playwright/test";
import {museumRooms} from "../../src/content/discovery";
import {discoveryCopy} from "../../src/content/discovery-copy";
import {LOCALES} from "../../src/i18n/config";

for(const locale of LOCALES){
  test(`${locale}: every Museum room has ordered navigation and correct boundaries`,async({page})=>{
    const copy=discoveryCopy[locale];
    for(let index=0;index<museumRooms.length;index++){
      await page.goto(`/${locale}/museum/${museumRooms[index]!.slug}`);
      const nav=page.getByRole("navigation",{name:copy.museum,exact:true});
      await expect(nav.getByRole("link",{name:copy.backMuseum,exact:true})).toHaveAttribute("href",`/${locale}/museum`);
      const previous=nav.getByRole("link",{name:copy.previousRoom});
      const next=nav.getByRole("link",{name:copy.nextRoom});
      if(index===0)await expect(previous).toHaveCount(0);
      else await expect(previous).toHaveAttribute("href",`/${locale}/museum/${museumRooms[index-1]!.slug}`);
      if(index===museumRooms.length-1)await expect(next).toHaveCount(0);
      else await expect(next).toHaveAttribute("href",`/${locale}/museum/${museumRooms[index+1]!.slug}`);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  });
}

test("Museum next and previous links support keyboard activation",async({page})=>{
  await page.goto(`/ro/museum/${museumRooms[0]!.slug}`);
  const next=page.getByRole("link",{name:discoveryCopy.ro.nextRoom});
  await next.focus();await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/ro/museum/${museumRooms[1]!.slug}$`));
  const previous=page.getByRole("link",{name:discoveryCopy.ro.previousRoom});
  await previous.focus();await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/ro/museum/${museumRooms[0]!.slug}$`));
});
