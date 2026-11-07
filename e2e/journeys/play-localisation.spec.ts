import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {LOCALES} from '../../src/i18n/config';
import {laboratoryCopy} from '../../src/content/laboratory-copy';
import {publicNavigationCopy} from '../../src/content/public-navigation-copy';

for(const locale of LOCALES)test(`${locale}: level chooser and world-map links use the selected language`,async({page})=>{
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 const guide=laboratoryCopy[locale],nav=publicNavigationCopy[locale];
 await page.goto(`/${locale}/play`);
 const panel=page.getByRole('complementary',{name:guide.guideLabel,exact:true});
 await expect(panel).toContainText(messages.play.levelChoiceHint);
 await panel.getByRole('button',{name:guide.hideGuide,exact:true}).click();
 await expect(panel).toHaveCount(0);
 await page.getByRole('button',{name:guide.showGuide,exact:true}).click();
 await expect(panel).toBeVisible();
 if(locale!=='en')await expect(page.locator('main')).not.toContainText('Choose a learning level that feels comfortable.');
 await page.getByRole('button',{name:new RegExp(messages.play.earlyLearner)}).click();
 await expect(page.getByRole('navigation',{name:nav.discover,exact:true})).toHaveCount(0);
 for(const path of ['museum','library','brain-lab','mind-lab','future-skills','inclusive-learning']){
  await expect(page.locator(`main a[href="/${locale}/${path}"]`)).toHaveCount(0);
 }
 await page.getByRole('button',{name:messages.navMenu.openMenu,exact:true}).click();
 const links=page.getByRole('dialog',{name:messages.navMenu.title,exact:true});
 for(const path of ['museum','library','brain-lab','mind-lab','future-skills','inclusive-learning']){
  await expect(links.locator(`a[href="/${locale}/${path}"]`)).toBeVisible();
 }
 await page.goto(`/${locale}/play/world/coin-cove`);
 await expect(page.locator('main')).toContainText(messages.worldDescriptions['coin-cove']);
 await expect(page.getByRole('complementary',{name:guide.guideLabel,exact:true})).toContainText(messages.worldDescriptions['coin-cove']);
 if(locale!=='en')await expect(page.locator('main')).not.toContainText('Where every quest begins');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
