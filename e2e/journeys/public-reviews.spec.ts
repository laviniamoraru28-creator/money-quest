import {test,expect} from "@playwright/test";
test("comment stays private until authenticated approval",async({page})=>{
  await page.goto("/en/reviews");const origin=new URL(page.url()).origin;
  const message=`Clear pictures and helpful choices ${test.info().project.name}.`;
  await page.getByRole("radio",{name:"4 stars",exact:true}).check();
  await page.getByLabel("Comment (optional, up to 500 characters)").fill(message);
  await page.getByRole("button",{name:"Send feedback",exact:true}).click();
  await expect(page.getByRole("status").filter({hasText:"waiting for moderation"})).toBeVisible();
  const before=await page.request.get("/api/reviews");expect(before.ok()).toBe(true);expect((await before.json()).comments.some((item:{comment:string})=>item.comment===message)).toBe(false);
  const denied=await page.request.post("/api/reviews/moderate",{headers:{Origin:origin},data:{action:"list"}});expect(denied.status()).toBe(401);
  const key=process.env.MONEYQUEST_REVIEW_MODERATION_KEY;expect(key).toBeTruthy();
  const headers={Origin:origin,Authorization:`Bearer ${key}`};
  const queue=await page.request.post("/api/reviews/moderate",{headers,data:{action:"list"}});expect(queue.ok()).toBe(true);
  const pending=(await queue.json()).find((item:{comment:string;status:string})=>item.comment===message&&item.status==="pending");expect(pending).toBeTruthy();
  const approved=await page.request.post("/api/reviews/moderate",{headers,data:{action:"approve",id:pending.id}});expect(approved.ok()).toBe(true);
  await page.reload();await expect(page.getByText(message,{exact:true})).toBeVisible();
  const injection=await page.request.post("/api/reviews",{headers:{Origin:origin},data:{rating:5,comment:"Email hello@example.com"}});expect(injection.status()).toBe(400);
  const otherOrigin=await page.request.post("/api/reviews",{headers:{Origin:"https://unrelated.example"},data:{rating:5,comment:""}});expect(otherOrigin.status()).toBe(403);
});
