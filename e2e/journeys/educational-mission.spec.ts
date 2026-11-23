import {expect,test} from "@playwright/test";
import {readFileSync} from "node:fs";

const messages=JSON.parse(readFileSync("messages/en.json","utf8"));
for(const band of ["explorer","builder","strategist"] as const){
 test(`${band} enters the world, completes a mission and keeps one reward`,async({page},info)=>{
  await page.goto("/en");
  await page.locator(`.mq-age-portal[href*="band=${band}"]`).click();
  const button=(name:string)=>page.getByRole("button",{name,exact:true});
  await button("Avatar 3").click();
  await button("Enter the world").click();
  await button("World map").click();
  await button("Money Quest").click();
  await page.getByRole("link",{name:"Start adventure",exact:true}).click();
  await page.getByRole("link",{name:/Coin Cove/}).click();
  const id=`${band}-money_basics-l1`;
  await page.locator(`main a[href$="/${id}"]`).click();
  const action=page.locator("#mission-decision");
  await page.locator('a[href="#mission-decision"]').click();
  await expect(action).toBeInViewport();
  await info.attach("mission",{body:await page.screenshot({path:info.outputPath("mission.png")}),contentType:"image/png"});
  const progress=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("moneyquest_local_progress_v1")!));
  const before=await progress();
  if(band==="explorer"){
   for(const name of ["Coin","Banknote","Debit card"])await button(name).click();
   await button("Continue").click();
   for(let i=0;i<3;i++)await button("Add").click();
   await button("Check").click();await button("Continue").click();await button("Debit card").click();await button("Continue").click();
   await button("Your bank account").click();
  }else{
   const quiz=messages.curriculum[id].quiz;
   const wrong=quiz.options.find((value:string)=>value!==quiz.correctAnswer);
   await action.getByRole("radio",{name:wrong,exact:true}).check();
   await button(messages.lesson.checkMyAnswer).click();
   await expect(action.getByText(quiz.explanation,{exact:true})).toBeVisible();
   expect(await progress()).toEqual(before);
   await button(messages.common.tryAgain).click();
   await action.getByRole("radio",{name:quiz.correctAnswer,exact:true}).check();
   await button(messages.lesson.checkMyAnswer).click();
  }
  const result=page.locator("#mission-result");
  await expect(result).toBeVisible();
  await result.scrollIntoViewIfNeeded();
  await info.attach("reward",{body:await page.screenshot({path:info.outputPath("reward.png")}),contentType:"image/png"});
  const after=await progress();
  expect(after.walletBalanceMinorUnits).toBeGreaterThan(before.walletBalanceMinorUnits);
  expect(after.completedActivityIds.filter((value:string)=>value===id)).toHaveLength(1);
  await page.reload();await expect(result).toBeVisible();
  expect((await progress()).walletBalanceMinorUnits).toBe(after.walletBalanceMinorUnits);
 });
}
