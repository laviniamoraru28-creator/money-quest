import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {parentGuideCopy,PARENT_GUIDE_SOURCES} from "../../src/content/parent-guide-copy";
import {shopFlowCopy} from "../../src/content/shop-flow-copy";
import {shopTermsCopy} from "../../src/content/shop-terms-copy";
import {SHOP_TERMS_VERSION} from "../../src/content/shop";
import {shopCatalogueCopy} from "../../src/content/shop-catalogue-copy";
test("shop catalogue stays unpublished (404) while purchases are paused",async({page,request})=>{
 // The storefront itself is kept (src/app/[locale]/parents/shop/page.tsx),
 // not deleted, behind checkoutPaused() — see src/lib/commerce/checkout-pause.ts.
 // Its catalogue/disclosure rendering is covered at the unit level
 // (test-shop-catalogue-presentation.ts) for whenever purchases resume;
 // this just locks in that the public route stays hidden by default.
 expect((await request.get("/en/parents/shop")).status()).toBe(404);
 await page.goto("/en/parents/shop");await expect(page.getByRole("heading",{level:1})).not.toContainText(shopCatalogueCopy.en.copy.title);
});
test("download terms preserve English disclosures and English navigation",async({page})=>{
 await page.goto("/en/parents/shop/terms");await expect(page).toHaveURL(/\/en\/parents\/shop\/terms$/);
 const main=page.locator("main");
 await expect(main.getByRole("heading",{level:1})).toHaveText(shopTermsCopy.en.title);
 await expect(main.getByText(shopTermsCopy.en.status.replace("{version}",SHOP_TERMS_VERSION),{exact:true})).toBeVisible();
 for(const i of [1,2,3,4,5,6] as const){await expect(main.getByRole("heading",{name:shopTermsCopy.en[`heading${i}`],exact:true})).toBeVisible();await expect(main.getByText(shopTermsCopy.en[`body${i}`],{exact:true})).toBeVisible();}
 await expect(main.getByRole("link",{name:shopTermsCopy.en.back,exact:true})).toHaveAttribute("href","/en/parents/shop");
 await expect(main.getByRole("link",{name:shopTermsCopy.en.privacy,exact:true})).toHaveAttribute("href","/en/privacy");
 await expect(main.locator("form,input")).toHaveCount(0);
});
for(const path of ["/en/parents/resources","/en/parents/shop/terms"]){
 test(`parent resource page, samples and accessibility: ${path}`,async({page})=>{
  await page.goto(path);await expect(page.locator("main h1")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
  const canonical=await page.locator('link[rel="canonical"]').getAttribute("href");expect(new URL(canonical!).pathname).toBe(path);
 });
}
test("parent shop is not promoted from home while purchases are paused",async({page})=>{
 await page.setViewportSize({width:320,height:900});await page.goto("/en");
 await expect(page.getByRole("region",{name:"Parent shop · PDFs",exact:true})).toHaveCount(0);
 await expect(page.locator('a[href="/parents/shop"]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test("free samples are real PDF downloads and checkout fails closed without configuration",async({request})=>{
 for(const file of ["free-academy-activities-en.pdf","free-journal-30-days-en.pdf"]){const response=await request.get(`/resources/samples/${file}`);expect(response.ok()).toBe(true);expect(response.headers()["content-type"]).toContain("application/pdf");expect((await response.body()).subarray(0,4).toString()).toBe("%PDF");}
 const checkout=await request.post("/api/shop/checkout",{data:{productId:"family-adventure-pack",adultPurchaser:true,instantSupply:true,cancellationAcknowledged:true}});expect(checkout.status()).toBe(503);
 const download=await request.post("/api/shop/download",{form:{token:"invalid"}});expect(download.status()).toBe(403);
});
test("order and recovery routes are noindex and not listed in the sitemap",async({page,request})=>{
 const sitemap=await (await request.get("/sitemap.xml")).text();expect(sitemap).not.toContain("/parents/shop/success");expect(sitemap).not.toContain("/parents/shop/download");
 for(const path of ["/en/parents/shop/success","/en/parents/shop/download"]){await page.goto(path);await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);}
});

test("parent guide retains localized sample links, sources and English navigation",async({page})=>{
 await page.goto("/en/parents/resources");await expect(page).toHaveURL(/\/en\/parents\/resources$/);
 await expect(page.getByText(/augmentative and alternative communication \(AAC\)/)).toBeVisible();
 for(const source of PARENT_GUIDE_SOURCES)await expect(page.getByRole("link",{name:source.title,exact:true})).toHaveAttribute("href",source.url);
 await expect(page.getByRole("link",{name:parentGuideCopy.en.journalSample,exact:true})).toHaveAttribute("href","/resources/samples/free-journal-30-days-en.pdf");
 // The Academy Activity Pack is unpublished this release: no promotional
 // link to its free sample should remain on this page.
 await expect(page.locator('a[href="/resources/samples/free-academy-activities-en.pdf"]')).toHaveCount(0);
});

test("order retry localizes errors without another payment and removes query references",async({page})=>{
 let attempts=0,checkouts=0;
 page.on("request",request=>{if(new URL(request.url()).pathname==="/api/shop/checkout")checkouts++;});
 await page.route("**/api/shop/order",async route=>{
  expect(route.request().method()).toBe("POST");expect(route.request().postDataJSON()).toEqual({sessionId:"cs_test_ui_fixture12345",checkout:"abcd1234"});
  attempts++;
  await route.fulfill({status:attempts===1?409:200,contentType:"application/json",body:JSON.stringify(attempts===1?{code:"order_not_ready",message:"RAW INTERNAL ORDER ERROR"}:{token:"ui-fixture-token-not-a-real-order"})});
 });
 await page.goto("/en/parents/shop/success?session_id=cs_test_ui_fixture12345&checkout=abcd1234");
 await expect(page).toHaveURL(/\/en\/parents\/shop\/success$/);
 await expect(page.getByRole("status").filter({hasText:shopFlowCopy.en.orderNotReady})).toHaveText(shopFlowCopy.en.orderNotReady);
 await expect(page.getByText(/RAW INTERNAL ORDER ERROR/)).toHaveCount(0);
 await page.getByRole("button",{name:shopFlowCopy.en.recheck,exact:true}).click();
 await expect(page.getByRole("status").filter({hasText:shopFlowCopy.en.verified})).toHaveText(shopFlowCopy.en.verified);
 await expect(page.getByText(shopFlowCopy.en.englishFiles,{exact:true})).toBeVisible();
 const form=page.locator('form[action="/api/shop/download"]');await expect(form).toHaveAttribute("method","post");await expect(form.locator('input[name="token"]')).toHaveValue("ui-fixture-token-not-a-real-order");
 await expect(page.getByRole("button",{name:shopFlowCopy.en.download,exact:true})).toBeVisible();expect(attempts).toBe(2);expect(checkouts).toBe(0);
});

test("recovery verifies the token before displaying private POST download forms",async({page})=>{
 let orders=0,verify!:()=>void;const pending=new Promise<void>(resolve=>{verify=resolve;});
 await page.route("**/api/shop/order",async route=>{orders++;expect(route.request().postDataJSON()).toEqual({token:"ui-recovery-fixture-not-a-real-order"});await pending;await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({token:"ui-recovery-fixture-not-a-real-order",bonusAvailable:false})});});
 await page.goto("/en/parents/shop/download#token=ui-recovery-fixture-not-a-real-order");
 await expect(page).toHaveURL(/\/en\/parents\/shop\/download$/);
 await expect.poll(()=>orders).toBe(1);await expect(page.locator('form[action="/api/shop/download"]')).toHaveCount(0);
 verify();await expect(page.getByRole("status").filter({hasText:shopFlowCopy.en.verified})).toHaveText(shopFlowCopy.en.verified);
 for(const action of ["download","receipt"]){const form=page.locator(`form[action="/api/shop/${action}"]`);await expect(form).toHaveAttribute("method","post");await expect(form.locator('input[name="token"]')).toHaveValue("ui-recovery-fixture-not-a-real-order");}
 expect(orders).toBe(1);
});
