import {readFileSync} from 'node:fs';
import {test,expect,type Page} from '@playwright/test';
import {LESSON_STRUCTURES} from '../../src/content/curriculum/structures';
import {GAME_STRUCTURES} from '../../src/game-engine/structures';
import {buildGameConfigFromStructure} from '../../src/game-engine/build-config';
import {getVariant,type GameRound} from '../../src/game-engine/types';

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

for(const band of ['explorer','strategist'] as const)test(`${band}: complete every core lesson and standard game through the controls`,async({page})=>{
 test.setTimeout(600000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/en/play');
 await page.getByRole('button',{name:band==='explorer'?/Explorer.*6-8/:/Strategist.*12-14/}).click();
 const expectedIds:string[]=[];
 for(const lesson of LESSON_STRUCTURES.filter(item=>item.ageBand===band)){
  await test.step(lesson.id,async()=>{
   await page.goto(`/en/play/world/${lesson.worldId}/lesson/${lesson.id}`);
   await page.getByRole('radio',{name:messages.curriculum[lesson.id].quiz.correctAnswer,exact:true}).check();
   await page.getByRole('button',{name:messages.lesson.checkMyAnswer,exact:true}).click();
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
