import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for(const path of ["/en/parents/resources","/en/parents/shop","/en/parents/shop/terms"]){
 test(`parent resource page, samples and accessibility: ${path}`,async({page})=>{
  await page.goto(path);await expect(page.locator("main h1")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
  const canonical=await page.locator('link[rel="canonical"]').getAttribute("href");expect(new URL(canonical!).pathname).toBe(path);
 });
}
test("parent shop is visible from home at narrow widths and learning stays available",async({page})=>{
 await page.setViewportSize({width:320,height:900});await page.goto("/en");
 await expect(page.getByRole("link",{name:"Parent shop · PDFs",exact:true})).toBeVisible();
 const image=page.getByRole("img",{name:/AI-generated illustration of a smiling child/});
 await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.getByRole("link",{name:"Parent shop · PDFs",exact:true}).click();await expect(page.getByRole("heading",{name:"Bring Money Quest learning to your kitchen table"})).toBeVisible();
 await expect(page.getByText("Purchases open after review",{exact:true})).toHaveCount(2);
 await expect(page.getByRole("button",{name:"Purchases open after review"}).first()).toBeDisabled();
});
test("free samples are real PDF downloads and checkout fails closed without configuration",async({request})=>{
 for(const file of ["free-family-sample-en.pdf","free-journal-week-one-en.pdf"]){const response=await request.get(`/resources/samples/${file}`);expect(response.ok()).toBe(true);expect(response.headers()["content-type"]).toContain("application/pdf");expect((await response.body()).subarray(0,4).toString()).toBe("%PDF");}
 const checkout=await request.post("/api/shop/checkout",{data:{productId:"family-adventure-pack",adultPurchaser:true,instantSupply:true,cancellationAcknowledged:true}});expect(checkout.status()).toBe(503);
 const download=await request.post("/api/shop/download",{form:{token:"invalid"}});expect(download.status()).toBe(403);
});
test("order and recovery routes are noindex and not listed in the sitemap",async({page,request})=>{
 const sitemap=await (await request.get("/sitemap.xml")).text();expect(sitemap).not.toContain("/parents/shop/success");expect(sitemap).not.toContain("/parents/shop/download");
 for(const path of ["/en/parents/shop/success","/en/parents/shop/download"]){await page.goto(path);await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);}
});
