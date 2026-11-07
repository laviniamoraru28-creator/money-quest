import {test,expect} from '@playwright/test';
import {createDefaultState} from '../../src/lib/entrepreneur-quest/state';
import {EQ_STAGES} from '../../src/content/entrepreneur-quest/structures';

test('saving costs and price keeps both edits when advancing, reloading and simulating',async({page})=>{
 const initial=createDefaultState();
 initial.completedStageIds=EQ_STAGES.filter(stage=>stage.order<9).map(stage=>stage.id);
 initial.business.businessName='Rainbow Bookmarks';
 await page.addInitScript(state=>{
  if(!localStorage.getItem('moneyquest_entrepreneur_quest_v1'))localStorage.setItem('moneyquest_entrepreneur_quest_v1',JSON.stringify(state));
 },initial);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading',{name:'Understand Costs',exact:true})).toBeVisible();
 await page.getByRole('spinbutton').fill('1');
 await page.getByRole('button',{name:'Save and Continue',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Set Your Price',exact:true})).toBeVisible();
 await page.getByRole('spinbutton').fill('3');
 await page.getByRole('button',{name:'Save and Continue',exact:true}).click();
 await page.reload();
 await expect(page.getByRole('heading',{name:'Create Your Marketing',exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!));
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
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_entrepreneur_quest_v1')!).latestSimulatorRun);
 expect(result.unitsSold).toBe(3);
 expect(result.salesMinorUnits).toBe(900);
 expect(result.profitMinorUnits).toBe(-2600);
 expect(result.remainingMoneyMinorUnits).toBe(2400);
 await expect(page.getByText('£24.00',{exact:true})).toBeVisible();
});

test('keyboard activation of the simulator link saves the build stage',async({page})=>{
 const initial=createDefaultState();
 initial.completedStageIds=EQ_STAGES.filter(stage=>stage.order<12).map(stage=>stage.id);
 await page.addInitScript(state=>{
  if(!localStorage.getItem('moneyquest_entrepreneur_quest_v1'))localStorage.setItem('moneyquest_entrepreneur_quest_v1',JSON.stringify(state));
 },initial);
 await page.goto('/en/entrepreneur-quest/build');
 const link=page.getByRole('link',{name:'Go to the Business Simulator',exact:true});
 await expect(link.locator('button')).toHaveCount(0);
 await link.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/entrepreneur-quest\/simulator$/);
 await page.goto('/en/entrepreneur-quest/build');
 await expect(page.getByRole('heading',{name:'Calculate Your Profit',exact:true})).toBeVisible();
});
