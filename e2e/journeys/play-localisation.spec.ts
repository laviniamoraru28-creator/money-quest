import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {LOCALES} from '../../src/i18n/config';
import {laboratoryCopy} from '../../src/content/laboratory-copy';
import {discoveryCopy} from '../../src/content/discovery-copy';
import {publicNavigationCopy} from '../../src/content/public-navigation-copy';

for(const locale of LOCALES)test(`${locale}: level chooser and world-map links use the selected language`,async({page})=>{
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 const guide=laboratoryCopy[locale],nav=publicNavigationCopy[locale],discovery=discoveryCopy[locale];
 await page.goto(`/${locale}/play`);
 const panel=page.getByRole('complementary',{name:guide.guideLabel,exact:true});
 await expect(panel).toContainText(messages.play.levelChoiceHint);
 await panel.getByRole('button',{name:guide.hideGuide,exact:true}).click();
 await expect(panel).toHaveCount(0);
 await page.getByRole('button',{name:guide.showGuide,exact:true}).click();
 await expect(panel).toBeVisible();
 if(locale!=='en')await expect(page.locator('main')).not.toContainText('Choose a learning level that feels comfortable.');
 await page.getByRole('button',{name:new RegExp(messages.play.earlyLearner)}).click();
 const links=page.getByRole('navigation',{name:nav.discover,exact:true});
 for(const [path,label] of [['museum',discovery.museum],['library',discovery.library],['brain-lab',nav.brain],['mind-lab',nav.mind],['future-skills',nav.future],['inclusive-learning',nav.inclusive]]){
  await expect(links.getByRole('link',{name:label,exact:true})).toHaveAttribute('href',`/${locale}/${path}`);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
