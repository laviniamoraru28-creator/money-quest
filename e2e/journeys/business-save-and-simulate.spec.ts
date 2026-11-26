import {test,expect} from '@playwright/test';
import {createDefaultState as createLocalProgressDefault} from '../../src/lib/local-progress/state';
import {createDefaultState} from '../../src/lib/entrepreneur-quest/state';
import {EQ_STAGES} from '../../src/content/entrepreneur-quest/structures';

// Entrepreneur Quest's own save is scoped per age band (see
// band-scoped-storage.ts) - these tests pick a band and seed
// local-progress's ageBand too, since EQ's hook reads the CURRENTLY
// selected band to know which slice of its own storage to use.
const BAND = 'builder' as const;

test('saving costs and price keeps both edits when advancing, reloading and simulating',async({page})=>{
 const initial=createDefaultState();
 initial.completedStageIds=EQ_STAGES.filter(stage=>stage.order<9).map(stage=>stage.id);
 initial.business.businessName='Rainbow Bookmarks';
 await page.addInitScript(([localProgress,eqState])=>{
  localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify(localProgress));
  if(!localStorage.getItem('moneyquest_entrepreneur_quest_v1'))localStorage.setItem('moneyquest_entrepreneur_quest_v1',JSON.stringify(eqState));
 },[{...createLocalProgressDefault(),ageBand:BAND},{byBand:{[BAND]:initial}}]);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading',{name:'Understand Costs',exact:true})).toBeVisible();
 await page.getByRole('spinbutton').fill('1');
 await page.getByRole('button',{name:'Save and Continue',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Set Your Price',exact:true})).toBeVisible();
 await page.getByRole('spinbutton').fill('3');
 await page.getByRole('button',{name:'Save and Continue',exact:true}).click();
 await page.reload();
 await expect(page.getByRole('heading',{name:'Create Your Marketing',exact:true})).toBeVisible();
 const saved=await page.evaluate((band)=>JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!).byBand[band],BAND);
 expect(saved.business.costPerUnitMinorUnits).toBe(100);
 expect(saved.business.priceMinorUnits).toBe(300);
 expect(saved.completedStageIds).toContain('understand-costs');
 expect(saved.completedStageIds).toContain('set-your-price');
 await page.goto('/en/entrepreneur-quest/simulator');
 for(const [category,amount] of [['Materials',20],['Packaging',5],['Advertising',10],['Money kept aside',15]] as const){
  for(let i=0;i<amount;i++)await page.getByRole('button',{name:`Increase ${category}`,exact:true}).click();
 }
 await page.getByRole('button',{name:'See What Happens',exact:true}).click();
 await expect(page.getByText('You made 20 items',{exact:true})).toBeVisible();
 const result=await page.evaluate((band)=>JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!).byBand[band].latestSimulatorRun,BAND);
 expect(result.unitsSold).toBe(3);
 expect(result.salesMinorUnits).toBe(900);
 expect(result.profitMinorUnits).toBe(-2600);
 expect(result.remainingMoneyMinorUnits).toBe(2400);
 await expect(page.getByText('£24.00',{exact:true})).toBeVisible();
});

test('keyboard entry opens the simulator and only a completed run advances the build stage',async({page})=>{
 const initial=createDefaultState();
 initial.completedStageIds=EQ_STAGES.filter(stage=>stage.order<12).map(stage=>stage.id);
 await page.addInitScript(([localProgress,eqState])=>{
  localStorage.setItem('moneyquest_local_progress_v1',JSON.stringify(localProgress));
  if(!localStorage.getItem('moneyquest_entrepreneur_quest_v1'))localStorage.setItem('moneyquest_entrepreneur_quest_v1',JSON.stringify(eqState));
 },[{...createLocalProgressDefault(),ageBand:BAND},{byBand:{[BAND]:initial}}]);
 await page.goto('/en/entrepreneur-quest/build');
 const link=page.getByRole('link',{name:'Go to the Business Simulator',exact:true});
 await expect(link.locator('button')).toHaveCount(0);
 await link.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/entrepreneur-quest\/simulator$/);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(link).toBeVisible();
 const saved=await page.evaluate(band=>JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!).byBand[band],BAND);
 expect(saved.completedStageIds).not.toContain('make-your-first-sale');
 await link.press('Enter');
 for(const [category,amount] of [['Materials',20],['Packaging',5],['Advertising',10],['Money kept aside',15]] as const){
  for(let i=0;i<amount;i++)await page.getByRole('button',{name:`Increase ${category}`,exact:true}).click();
 }
 await page.getByRole('button',{name:'See What Happens',exact:true}).press('Enter');
 await expect.poll(()=>page.evaluate(band=>JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!).byBand[band].latestSimulatorRun,BAND)).toBeTruthy();
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading',{name:'Calculate Your Profit',exact:true})).toBeVisible();
});
