import {readFileSync} from 'node:fs';
import {test,expect,type Page} from '@playwright/test';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {GAME_STRUCTURES} from '../../src/game-engine/structures';
import {buildGameConfigFromStructure} from '../../src/game-engine/build-config';
import {getVariant,type GameRound} from '../../src/game-engine/types';
import {moneyBasicsLessonCopy} from '../../src/content/explorer-money-basics-lesson';

const messages=JSON.parse(readFileSync('messages/en.json','utf8'));
async function solveRound(page:Page,round:GameRound){
 const button=(name:string)=>page.getByRole('button',{name,exact:true});
 switch(round.mechanic){
  case 'multiple-choice':
   await page.getByRole('radio',{name:round.correctOption,exact:true}).check();
   await button(messages.lesson.checkMyAnswer).click();break;
  case 'numeric':
   await page.getByRole('spinbutton').fill(String(round.correctValue));
   await button(messages.lesson.checkMyAnswer).click();break;
  case 'sort':
   for(const item of round.items){
    await page.getByRole('group',{name:messages.game.itemsToSort,exact:true}).getByRole('button',{name:item.label,exact:true}).click();
    await button(round.buckets.find(bucket=>bucket.key===item.correctBucketKey)!.label).click();
   }
   await button(messages.game.checkMySorting).click();break;
  case 'match':
   for(const pair of round.pairs){
    await page.getByRole('group',{name:messages.game.matchThese,exact:true}).getByRole('button',{name:pair.left,exact:true}).click();
    await page.getByRole('group',{name:messages.game.withThese,exact:true}).getByRole('button',{name:pair.right,exact:true}).click();
   }break;
  case 'compare':
   await page.getByRole('button').filter({has:page.getByText(round.options.find(option=>option.key===round.correctOptionKey)!.label,{exact:true})}).click();
   await button(messages.game.checkMyChoice).click();break;
  case 'allocate':
   for(const target of round.targets){
    const category=round.categories.find(item=>item.key===target.categoryKey)!;
    expect(target.targetMinorUnits%100).toBe(0);
    for(let value=0;value<target.targetMinorUnits;value+=100)await button(messages.a11y.increaseCategory.replace('{category}',category.label)).click();
   }
   await button(messages.game.checkMyPlan).click();break;
  case 'spot':
   for(const item of round.items.filter(item=>item.isSuspicious))await button(item.text).click();
   await button(messages.game.checkWhatIFound).click();break;
  case 'mission':
   // Every mission choice is valid. Its consequence must remain visible.
   await page.getByRole('button').filter({has:page.getByText(round.choices[0]!.label,{exact:true})}).click();break;
 }
}

/** Every Explorer lesson runs its own picture-first interactive flow
 * instead of a single quiz radio; this drives each topic's exact
 * activity sequence (verified directly against the running app). */
async function completeExplorerLesson(page:Page,topicId:string){
 const button=(name:string|RegExp)=>page.getByRole('button',{name,exact:typeof name==='string'});
 switch(topicId){
  case 'money_basics':{
   const en=moneyBasicsLessonCopy.en;
   const descriptions:Record<string,string>={Coin:en.coinDesc,Banknote:en.banknoteDesc,'Debit card':en.cardDesc};
   const tapped:string[]=[];
   for(const label of ['Coin','Banknote','Debit card']){
    await button(label).click();
    tapped.push(label);
    // Each card's own explanation appears immediately under it and stays
    // visible as the other cards are tapped — regression coverage for the
    // money-quest translation audit's "tap each image, see its explanation,
    // keep it visible" fix.
    for(const seen of tapped)await expect(page.getByText(descriptions[seen]!,{exact:true})).toBeVisible();
   }
   await button('Continue').click();
   await button('Add').click();await button('Add').click();await button('Add').click();
   await button('Check').click();
   await page.locator('[data-explorer-coin-count]').getByRole('button',{name:'Continue',exact:true}).click();
   await button('Debit card').click();
   // Paying shows a visible/spoken confirmation and waits for its own
   // Continue click before advancing (see ExplorerMiniShop) — distinct
   // from the picture-choice stage's own Continue click two lines down.
   await button('Continue').click();
   await button('Your bank account').click();
   await button('Continue').click();
   break;}
  case 'needs_wants':
   await button('Food').click();await button(/Need/).click();
   await button('Water').click();await button(/Need/).click();
   await button('Toy car').click();await button(/Want/).click();
   await button('Candy').click();await button(/Want/).click();
   await page.locator('[data-explorer-picture-sort]').getByRole('button',{name:'Continue',exact:true}).click();
   await button('The ball').click();await button('Continue').click();
   break;
  case 'saving':{
   const coins=page.locator('[data-explorer-saving-jar] button[draggable]');
   const count=await coins.count();
   for(let i=0;i<count;i++)await coins.nth(i).click();
   await page.locator('[data-explorer-saving-jar]').getByRole('button',{name:'Continue',exact:true}).click();
   await button('In a bank account').click();await button('Continue').click();
   await button('Keep it for later').click();await button('Continue').click();
   break;}
  case 'currencies':
   await button('Pound').click();await button(/United Kingdom/).click();
   await button('Leu').click();await button(/Romania/).click();
   await button('Euro').click();await button(/Europe/).click();
   await button('Yen').click();await button(/Japan/).click();
   await page.locator('[data-explorer-picture-sort]').getByRole('button',{name:'Continue',exact:true}).click();
   await button('Yen').click();await button('Continue').click();
   break;
  case 'scams':
   await button('Keep it in a safe place').click();await button('Continue').click();
   await button('Only me').click();await button('Continue').click();
   await button('Don’t share it, tell a trusted adult').click();await button('Continue').click();
   await button('Ask a parent or trusted adult').click();await button('Continue').click();
   break;
  case 'long_term_thinking':
   await button('Save a little money each week').click();await button('Continue').click();
   for(const w of ['Week 1','Week 2','Week 3','Week 4'])await button(w).click();
   await page.locator('[data-explorer-sequence]').getByRole('button',{name:'Continue',exact:true}).click();
   await button('A savings jar or account').click();await button('Continue').click();
   for(const s of ['Pick a goal','Save a little each week','Check how close you are','Reach your goal!'])await button(s).click();
   await page.locator('[data-explorer-sequence]').getByRole('button',{name:'Continue',exact:true}).click();
   break;
  case 'giving':
   await button('Coin').first().click();await button(/Give/).click();
   for(let i=0;i<4;i++){await button('Coin').first().click();await button(/Keep/).click();}
   await page.locator('[data-explorer-picture-sort]').getByRole('button',{name:'Continue',exact:true}).click();
   await button(/animal shelter/i).click();
   await button('Send the gift').click();await button('Continue').click();
   break;
  case 'digital_money':
   await button('Yes, it goes down either way').click();await button('Continue').click();
   break;
  case 'investing_basics':
   for(const s of ['Seed','Sprout','Bud','Flower'])await button(s).click();
   await page.locator('[data-explorer-sequence]').getByRole('button',{name:'Continue',exact:true}).click();
   await button('Investing').click();await button('Continue').click();
   await button('No, it can go up or down').click();await button('Continue').click();
   break;
  case 'junior_isa':
   await button('Parent or trusted adult').click();await button('Continue').click();
   break;
  default:
   throw new Error(`no Explorer completion dispatcher for topic ${topicId}`);
 }
}

for(const band of ['explorer','strategist'] as const)test(`${band}: complete every core lesson and standard game through the controls`,async({page})=>{
 test.setTimeout(600000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/en/play');
 await page.getByRole('button',{name:band==='explorer'?/Explorer.*6-8/:/Strategist.*12-14/}).click();
 const expectedIds:string[]=[];
 for(const lesson of LESSON_STRUCTURES.filter(item=>item.ageBand===band)){
  await test.step(lesson.id,async()=>{
   await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
   if(band==='explorer')await completeExplorerLesson(page,lesson.topicId);
   else{
    await page.getByRole('radio',{name:messages.curriculum[lesson.id].quiz.correctAnswer,exact:true}).check();
    await page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true}).click();
   }
   await expect(page.getByText(messages.activityGuide.lessonComplete,{exact:true})).toBeVisible();
   expectedIds.push(lesson.id);
  });
 }
 for(const structure of GAME_STRUCTURES.filter(item=>item.variants.some(variant=>variant.ageBand===band&&variant.difficulty==='standard'))){
  await test.step(structure.key,async()=>{
   const id=`game-${band}-${structure.key}`;
   const variant=getVariant(buildGameConfigFromStructure(structure,messages.games[structure.key]),band,'standard')!;
   await page.goto(`/en/play/world/${structure.worldId}/game/${id}`);
   for(let i=0;i<variant.rounds.length;i++){
    const round=variant.rounds[i]!;
    await expect(page.getByText(round.prompt,{exact:true})).toBeVisible();
    await solveRound(page,round);
    if(i<variant.rounds.length-1){
     await expect(page.getByText(round.explanation,{exact:true})).toBeVisible();
     await page.getByRole('button',{name:messages.game.nextRound,exact:true}).click();
    }
   }
   await expect(page.getByRole('heading',{name:messages.game.questComplete,exact:true})).toBeVisible();
   expectedIds.push(id);
  });
 }
 await page.reload();
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!));
 expect(progress.completedActivityIds.slice().sort()).toEqual(expectedIds.slice().sort());
 expect(new Set(progress.completedActivityIds).size).toBe(expectedIds.length);
 expect(progress.xpTotal).toBeGreaterThan(0);
 expect(errors).toEqual([]);
});
