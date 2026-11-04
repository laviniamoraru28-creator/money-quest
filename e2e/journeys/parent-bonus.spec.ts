import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {siteControlsCopy} from "../../src/content/site-controls-copy";
import {parentBonusCopy} from "../../src/content/parent-bonus-copy";
import {shopFlowCopy} from "../../src/content/shop-flow-copy";
import {shopProducts} from "../../src/content/shop";
import {LOCALES} from "../../src/i18n/config";

for(const locale of LOCALES){
 test(`${locale}: bonus promotion, full cover, mobile and night view`,async({page})=>{
  const copy=parentBonusCopy[locale];
  await page.goto(`/${locale}/parents/shop`);
  const promo=page.getByRole("region",{name:"Little Minds, Smart Money",exact:true});
  await expect(promo.getByText(copy.badge,{exact:true})).toBeVisible();
  for(const text of [copy.description,copy.activities,copy.included,copy.englishOnly])await expect(promo.getByText(text,{exact:true})).toBeVisible();
  const image=promo.getByRole("img",{name:copy.coverAlt,exact:true});await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await image.evaluate(el=>getComputedStyle(el).objectFit)).toBe("contain");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(promo.locator("form,a,button")).toHaveCount(0);await expect(page.locator("article[id]")).toHaveCount(shopProducts.length);
  await promo.screenshot({path:test.info().outputPath("bonus-light.png")});
  const settings=page.locator("details").filter({has:page.getByText(siteControlsCopy[locale].night,{exact:true})});
  await settings.locator("summary").click();
  await settings.getByRole("checkbox",{name:siteControlsCopy[locale].night,exact:true}).check();
  await settings.locator("summary").click();
  await expect(page.locator("html")).toHaveAttribute("data-night-view","true");
  await expect.poll(()=>promo.evaluate(el=>getComputedStyle(el).color)).toBe("rgb(255, 255, 255)");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await promo.screenshot({path:test.info().outputPath("bonus-night.png")});
 });
 test(`${locale}: verified success has two separate secure POST downloads`,async({page})=>{
  await page.route("**/api/shop/order",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({token:"mock-verified-purchase-token",bonusAvailable:true})}));
  await page.goto(`/${locale}/parents/shop/success?session_id=cs_test_mockpurchase1234&checkout=abcd1234`);
  await expect(page).toHaveURL(new RegExp(`/${locale}/parents/shop/success$`));
  const copy=parentBonusCopy[locale],button=page.getByRole("button",{name:copy.download,exact:true});await expect(button).toBeVisible();
  await expect(page.getByRole("button",{name:shopFlowCopy[locale].download,exact:true})).toBeVisible();
  await expect(page.getByText(copy.englishOnly,{exact:true})).toBeVisible();
  await expect(button.locator("..")).toHaveAttribute("method","post");
  await button.focus();await expect(button).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test("mock purchase keeps the product and adds the bonus; recovery rechecks payment",async({page})=>{
 test.skip(!process.env.MQ_BONUS_E2E_CHECKOUT,"Requires isolated sandbox fixture assets, never live credentials");
 const requests:string[]=[];
 await page.route("**/api/shop/checkout",async route=>{
  expect(route.request().postDataJSON()).toEqual({productId:shopProducts[0]!.id,adultPurchaser:true,instantSupply:true,cancellationAcknowledged:true});
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({url:"https://checkout.stripe.com/c/pay/mock-parent-bonus"})});
 });
 const base=new URL(test.info().project.use.baseURL as string||"http://127.0.0.1:3013").origin;
 await page.route("https://checkout.stripe.com/**",route=>route.fulfill({contentType:"text/html",body:`<h1>Mock Stripe payment</h1><a href="${base}/en/parents/shop/success?session_id=cs_test_mockpurchase1234&checkout=abcd1234">Complete mock payment</a>`}));
 await page.route("**/api/shop/order",async route=>{requests.push(JSON.stringify(route.request().postDataJSON()));await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({token:"mock-verified-purchase-token",bonusAvailable:true})});});
 await page.route("**/api/shop/download",async route=>{const body=new URLSearchParams(route.request().postData()!);expect(body.get("token")).toBe("mock-verified-purchase-token");const bonus=body.get("asset")==="parent-guide";await route.fulfill({status:200,headers:{"Content-Type":bonus?"application/pdf":"application/zip","Content-Disposition":`attachment; filename="${bonus?"Little_Minds_Smart_Money_Illustrated.pdf":"purchased-product.zip"}"`},body:bonus?Buffer.from("%PDF-1.7\nMock bonus download\n%%EOF"):Buffer.from("PK\x03\x04mock product")});});
 await page.goto("/en/parents/shop");
 const card=page.locator(`article#${shopProducts[0]!.id}`);for(const checkbox of await card.getByRole("checkbox").all())await checkbox.check();
 await card.getByRole("button",{name:shopFlowCopy.en.continueTest,exact:true}).click();
 await page.getByRole("link",{name:"Complete mock payment",exact:true}).click();
 const productDownload=page.waitForEvent("download");await page.getByRole("button",{name:shopFlowCopy.en.download,exact:true}).click();expect((await productDownload).suggestedFilename()).toBe("purchased-product.zip");
 const bonusDownload=page.waitForEvent("download"),bonus=page.getByRole("button",{name:parentBonusCopy.en.download,exact:true});await bonus.focus();await page.keyboard.press("Enter");expect((await bonusDownload).suggestedFilename()).toBe("Little_Minds_Smart_Money_Illustrated.pdf");
 const a11y=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(a11y.violations).toEqual([]);
 await page.goto("/en/parents/shop/download#token=mock-verified-purchase-token");await expect(bonus).toBeVisible();await expect(page).toHaveURL(/\/en\/parents\/shop\/download$/);expect(requests.some(value=>JSON.parse(value).token==="mock-verified-purchase-token")).toBe(true);
});

test("unverified or legacy orders do not expose the parent guide",async({page,request})=>{
 let verified=false;
 await page.route("**/api/shop/order",route=>route.fulfill({status:verified?200:409,contentType:"application/json",body:JSON.stringify(verified?{token:"legacy-verified-token",bonusAvailable:false}:{code:"order_not_ready"})}));
 await page.goto("/en/parents/shop/success?session_id=cs_test_mockpurchase1234&checkout=abcd1234");await expect(page.getByRole("button",{name:shopFlowCopy.en.recheck,exact:true})).toBeVisible();await expect(page.getByRole("button",{name:parentBonusCopy.en.download,exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:shopFlowCopy.en.download,exact:true})).toHaveCount(0);
 verified=true;await page.getByRole("button",{name:shopFlowCopy.en.recheck,exact:true}).click();await expect(page.getByRole("button",{name:shopFlowCopy.en.download,exact:true})).toBeVisible();await expect(page.getByRole("button",{name:parentBonusCopy.en.download,exact:true})).toHaveCount(0);
 expect((await request.get("/Little_Minds_Smart_Money_Illustrated.pdf")).status()).toBe(404);
 const unauthorised=await request.post("/api/shop/download",{headers:{origin:"http://localhost:3013"},form:{token:"invalid",asset:"parent-guide",locale:"en"}});expect(unauthorised.status()).toBe(403);
});
