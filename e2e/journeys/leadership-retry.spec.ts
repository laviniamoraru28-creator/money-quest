import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {LQ_TEAM_CONFLICT_SPOT_ITEM_IDS,LQ_DEADLINE_CATEGORIES,LQ_PRESSURE_TEST_ITEMS,LQ_PRESSURE_TEST_BUCKET_KEYS} from '../../src/content/leadership-quest/structures';
const messages=JSON.parse(readFileSync('messages/en.json','utf8'));
test('an incorrect conflict answer can be retried without completing the mission',async({page})=>{
 await page.goto('/en/leadership-quest/missions/team-conflict');
 const items=messages.leadershipQuest.spotItems.teamConflict;
 await page.getByRole('button',{name:items['fine-whatever-you-want'],exact:true}).click();
 await page.getByRole('button',{name:messages.game.checkWhatIFound,exact:true}).click();
 await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:messages.common.tryAgain,exact:true}).click();
 for(const item of LQ_TEAM_CONFLICT_SPOT_ITEM_IDS.filter(item=>item.isSuspicious))await page.getByRole('button',{name:items[item.id],exact:true}).click();
 await page.getByRole('button',{name:messages.game.checkWhatIFound,exact:true}).click();
 await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:messages.common.tryAgain,exact:true})).toHaveCount(0);
});
test('a wrong time allocation can be retried and corrected',async({page})=>{
 await page.goto('/en/leadership-quest/missions/the-deadline');
 const labels=messages.leadershipQuest.missions['the-deadline'].tasks;
 const increase=(key:string)=>page.getByRole('button',{name:messages.a11y.increaseCategory.replace('{category}',labels[key]),exact:true});
 for(let i=0;i<10;i++)await increase(LQ_DEADLINE_CATEGORIES[0]!.key).click();
 await page.getByRole('button',{name:messages.game.checkMyPlan,exact:true}).click();
 await page.getByRole('button',{name:messages.common.tryAgain,exact:true}).click();
 for(const category of LQ_DEADLINE_CATEGORIES)for(let i=0;i<category.targetMinutes/100;i++)await increase(category.key).click();
 await page.getByRole('button',{name:messages.game.checkMyPlan,exact:true}).click();
 await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
});
test('wrong priority sorting can be retried without losing access to the items',async({page})=>{
 await page.goto('/en/leadership-quest/missions/pressure-test');
 const copy=messages.leadershipQuest.missions['pressure-test'];
 const place=async(correct:boolean)=>{
  for(const item of LQ_PRESSURE_TEST_ITEMS){
   await page.getByRole('group',{name:messages.game.itemsToSort,exact:true}).getByRole('button',{name:copy.problems[item.id],exact:true}).click();
   await page.getByRole('button',{name:copy.buckets[correct?item.correctBucketKey:LQ_PRESSURE_TEST_BUCKET_KEYS[0]],exact:true}).click();
  }
  await page.getByRole('button',{name:messages.game.checkMySorting,exact:true}).click();
 };
 await place(false);await page.getByRole('button',{name:messages.common.tryAgain,exact:true}).click();
 await place(true);await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
});
