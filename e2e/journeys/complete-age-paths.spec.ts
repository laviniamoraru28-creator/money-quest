import {readFileSync} from 'node:fs';
import {test,expect,type Page} from '@playwright/test';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {GAME_STRUCTURES} from '../../src/game-engine/structures';
import {buildGameConfigFromStructure} from '../../src/game-engine/build-config';
import {getVariant,type GameRound} from '../../src/game-engine/types';
import {moneyBasicsLessonCopy} from '../../src/content/explorer-money-basics-lesson';
import {needsWantsLessonCopy} from '../../src/content/explorer-needs-wants-lesson';
import {savingExtraLessonCopy} from '../../src/content/explorer-saving-lesson-extra';
import {currenciesLessonCopy} from '../../src/content/explorer-currencies-lesson';
import {safetyLessonCopy} from '../../src/content/explorer-safety-lesson';
import {longtermLessonCopy} from '../../src/content/explorer-longterm-lesson';
import {givingLessonCopy} from '../../src/content/explorer-giving-lesson';
import {digitalMoneyLessonCopy} from '../../src/content/explorer-digital-money-lesson';
import {investingLessonCopy} from '../../src/content/explorer-investing-lesson';
import {explorerScenario} from '../../src/content/explorer-other-lessons';
import {getActivityHref,getWorldCatalog} from '../../src/content/catalog';
import {WORLDS} from '../../src/content/worlds';
import {nextActivityCopy,romanianExplorerCopy} from '../../src/i18n/explorer-copy';

const messages=JSON.parse(readFileSync('messages/en.json','utf8'));
async function solveRound(page:Page,round:GameRound,copy=messages){
 const button=(name:string)=>page.getByRole('button',{name,exact:true});
 switch(round.mechanic){
  case 'multiple-choice':
   await page.getByRole('radio',{name:round.correctOption,exact:true}).check();
   await button(copy.lesson.checkMyAnswer).click();break;
  case 'numeric':
   await page.getByRole('spinbutton').fill(String(round.correctValue));
   await button(copy.lesson.checkMyAnswer).click();break;
  case 'sort':
   for(const item of round.items){
    await page.getByRole('group',{name:copy.game.itemsToSort,exact:true}).getByRole('button',{name:item.label,exact:true}).click();
    await button(round.buckets.find(bucket=>bucket.key===item.correctBucketKey)!.label).click();
   }
   await button(copy.game.checkMySorting).click();break;
  case 'match':
   for(const pair of round.pairs){
    await page.getByRole('group',{name:copy.game.matchThese,exact:true}).getByRole('button',{name:pair.left,exact:true}).click();
    await page.getByRole('group',{name:copy.game.withThese,exact:true}).getByRole('button',{name:pair.right,exact:true}).click();
   }break;
  case 'compare':
   await page.getByRole('button').filter({has:page.getByText(round.options.find(option=>option.key===round.correctOptionKey)!.label,{exact:true})}).click();
   await button(copy.game.checkMyChoice).click();break;
  case 'allocate':
   for(const target of round.targets){
    const category=round.categories.find(item=>item.key===target.categoryKey)!;
    expect(target.targetMinorUnits%100).toBe(0);
    for(let value=0;value<target.targetMinorUnits;value+=100)await button(copy.a11y.increaseCategory.replace('{category}',category.label)).click();
   }
   await button(copy.game.checkMyPlan).click();break;
  case 'spot':
   for(const item of round.items.filter(item=>item.isSuspicious))await button(item.text).click();
   await button(copy.game.checkWhatIFound).click();break;
  case 'mission':
   // Every mission choice is valid. Its consequence must remain visible.
   await page.getByRole('button').filter({has:page.getByText(round.choices[0]!.label,{exact:true})}).click();break;
 }
}

/** Every Explorer lesson runs its own picture-first interactive flow
 * instead of a single quiz radio; this drives each topic's exact
 * activity sequence (verified directly against the running app). */
async function completeExplorerLesson(page:Page,topicId:string,locale:"en"|"ro"="en"){
 const next=locale==='ro'?'Continuă':'Continue';
 const button=(name:string)=>page.getByRole('button',{name,exact:true});
 const choice=async (name:string)=>{
  const stage=page.locator('[data-explorer-picture-choice]');
  await stage.getByRole('button',{name,exact:true}).click();
  await stage.getByRole('button',{name:next,exact:true}).click();
 };
 const sort=async (pairs:[string,string][])=>{
  const stage=page.locator('[data-explorer-picture-sort]');
  for(const [item,destination] of pairs){
   await stage.getByRole('button',{name:item,exact:true}).first().click();
   await stage.getByRole('button',{name:new RegExp('^'+destination+' [0-9]+$')}).click();
  }
  await stage.getByRole('button',{name:next,exact:true}).click();
 };
 const sequence=async (steps:string[])=>{
  const stage=page.locator('[data-explorer-sequence]');
  for(const step of steps)await stage.getByRole('button',{name:step,exact:true}).click();
  await stage.getByRole('button',{name:next,exact:true}).click();
 };
 switch(topicId){
  case 'money_basics':{
   const c=moneyBasicsLessonCopy[locale];
   const pictures=page.locator('[data-explorer-discover]');
   for(const [label,description] of [[c.coin,c.coinDesc],[c.banknote,c.banknoteDesc],[c.card,c.cardDesc]] as const){
    await pictures.getByRole('button',{name:label,exact:true}).click();
    await expect(pictures.getByText(description,{exact:true})).toBeVisible();
   }
   await pictures.getByRole('button',{name:next,exact:true}).click();
   const coins=page.locator('[data-explorer-coin-count]');
   for(let i=0;i<3;i++)await coins.getByRole('button',{name:locale==='ro'?'Adaugă':'Add',exact:true}).click();
   await coins.getByRole('button',{name:locale==='ro'?'Verifică':'Check',exact:true}).click();
   await coins.getByRole('button',{name:next,exact:true}).click();
   const shop=page.locator('[data-explorer-mini-shop]');
   await shop.getByRole('button',{name:c.card,exact:true}).click();
   await shop.getByRole('button',{name:next,exact:true}).click();
   await choice(c.bankAccount);break;
  }
  case 'needs_wants':{
   const c=needsWantsLessonCopy[locale];
   await sort([[c.food,c.needLabel],[c.water,c.needLabel],[c.toyCar,c.wantLabel],[c.candy,c.wantLabel]]);
   await choice(c.ballChoice);break;
  }
  case 'saving':{
   const c=savingExtraLessonCopy[locale];
   const jar=page.locator('[data-explorer-saving-jar]');
   const coins=jar.locator('button[draggable]');
   await expect(coins).toHaveCount(6);
   for(const coin of await coins.all())await coin.click();
   await jar.getByRole('button',{name:next,exact:true}).click();
   await choice(c.bankChoice);await choice(c.saveChoice);break;
  }
  case 'currencies':{
   const c=currenciesLessonCopy[locale];
   await sort([[c.pound,c.uk],[c.leu,c.romania],[c.euro,c.europe],[c.yen,c.japan]]);
   await choice(c.prompt4yen);break;
  }
  case 'scams':{
   const c=safetyLessonCopy[locale];
   for(const answer of [c.safe1,c.safe2,c.safe3,c.safe4])await choice(answer);
   break;
  }
  case 'long_term_thinking':{
   const c=longtermLessonCopy[locale];
   await choice(c.goalBike);await sequence([c.week1,c.week2,c.week3,c.week4]);
   await choice(c.jarChoice);await sequence([c.planGoal,c.planSave,c.planCheck,c.planReach]);break;
  }
  case 'giving':{
   const c=givingLessonCopy[locale];
   await sort([[c.coinLabel,c.giveBox],...[1,2,3,4].map((): [string,string]=>[c.coinLabel,c.keepBox])]);
   await button(c.cause1).click();await choice(c.sendChoice);break;
  }
  case 'digital_money':
   await choice(digitalMoneyLessonCopy[locale].sameWay);break;
  case 'investing_basics':{
   const c=investingLessonCopy[locale];
   await sequence([c.seed,c.sprout,c.bud,c.flower]);await choice(c.investingChoice);await choice(c.upOrDown);break;
  }
  case 'junior_isa':
   await choice(explorerScenario(locale,'junior_isa').correct);break;
  default:
   throw new Error(`No Explorer completion dispatcher for topic ${topicId}`);
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

for(const locale of ['ro','en'] as const)test(`${locale}: Explorer follows the full mobile learning route in order`,async({page},info)=>{
 test.skip(info.project.name!=='mobile-chrome','runs one Android-sized browser per language');
 test.setTimeout(600_000);
 const copy=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 const progress=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moneyquest_local_progress_v1')!));
 const itinerary=WORLDS.flatMap(world=>getWorldCatalog(world.id,'explorer',key=>key));
 await page.goto(`/${locale}`);
 await page.getByRole('link',{name:new RegExp(locale==='ro'?romanianExplorerCopy.play.earlyLearner:copy.play.earlyLearner)}).click();
 await page.getByRole('link',{name:/Coin Cove/}).click();
 await page.locator(`main a[href$="${itinerary[0]!.id}"]`).click();
 const expected:string[]=[];
 for(const entry of itinerary){
  await test.step(entry.id,async()=>{
   await expect(page).toHaveURL(new RegExp(getActivityHref(entry.worldId,entry)+'$'));
   if(entry.activityType==='lesson')await completeExplorerLesson(page,entry.topicId,locale);
   else {
    const key=entry.id.slice('game-explorer-'.length);
    const structure=GAME_STRUCTURES.find(game=>game.key===key)!;
    const variant=getVariant(buildGameConfigFromStructure(structure,copy.games[key]),'explorer','standard')!;
    for(const [index,round] of variant.rounds.entries()){
     await expect(page.getByText(round.prompt,{exact:true})).toBeVisible();
     await solveRound(page,round,copy);
     if(index<variant.rounds.length-1)await page.getByRole('button',{name:copy.game.nextRound,exact:true}).click();
    }
   }
   expected.push(entry.id);
   await expect.poll(async()=> (await progress()).completedActivityIds).toEqual(expected);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(entry!==itinerary.at(-1))await page.getByRole('button',{name:nextActivityCopy[locale],exact:true}).click();
  });
 }
 const saved=await progress();
 await page.reload();
 expect(await progress()).toEqual(saved);
});
