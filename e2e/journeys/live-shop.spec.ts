import {test,expect} from "@playwright/test";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {createServer} from "node:net";
import {spawn,type ChildProcess} from "node:child_process";
import AxeBuilder from "@axe-core/playwright";
import {shopProducts} from "../../src/content/shop";
import {archiveName,type Release} from "../../src/lib/commerce/release";
let root="",base="",child:ChildProcess;
const marker="Synthetic browser fixture. Not a published legal policy. ";
test.beforeAll(async()=>{test.setTimeout(60000);
 root=await mkdtemp(path.join(tmpdir(),"mq-live-browser-"));const assets=path.join(root,"assets"),orders=path.join(root,"orders"),docroot=path.join(root,"public");await Promise.all([assets,orders,docroot].map(p=>mkdir(p)));
 const bytes=Buffer.from("UEsDBBQAAAAAAJRMXl392CNyQgAAAEIAAAANAAAAVEVTVC1PTkxZLnR4dFN5bnRoZXRpYyBhcmNoaXZlIGZvciBsb2NhbCB0ZXN0cyBvbmx5LiBOb3QgYSBNb25leSBRdWVzdCBwcm9kdWN0LlBLAQIUAxQAAAAAAJRMXl392CNyQgAAAEIAAAANAAAAAAAAAAAAAACAAQAAAABURVNULU9OTFkudHh0UEsFBgAAAAABAAEAOwAAAG0AAAAAAA==","base64"),hash=createHash("sha256").update(bytes).digest("hex");
 const release:Release={schema:1,accountId:"acct_browserfixture",merchant:{name:"Synthetic browser merchant",address:"Synthetic address for browser tests only",email:"support@merchant.test"},terms:{version:"2026-10-30-v1",text:marker.repeat(8)},privacy:marker.repeat(4),taxStatement:"Synthetic test price statement, not a tax assessment.",products:{"family-adventure-pack":{sha256:hash,bytes:bytes.length},"adventure-journal":{sha256:hash,bytes:bytes.length}}};
 for(const product of shopProducts)await writeFile(path.join(assets,archiveName(product,hash)),bytes);
 const releasePath=path.join(root,"release.json");await writeFile(releasePath,JSON.stringify(release));
 const reservation=createServer();await new Promise<void>(r=>reservation.listen(0,"127.0.0.1",r));const address=reservation.address();if(!address||typeof address==="string")throw new Error("No local fixture port");const port=address.port;await new Promise<void>(r=>reservation.close(()=>r()));base=`http://127.0.0.1:${port}`;
 child=spawn(process.execPath,["server.js"],{cwd:process.cwd(),stdio:"ignore",env:{...process.env,NODE_ENV:"production",PORT:String(port),MONEYQUEST_COMMERCE_MODE:"live",MONEYQUEST_STRIPE_KEY:"rk_live_browserfixture",MONEYQUEST_STRIPE_WEBHOOK_SECRET:"whsec_browserfixture",MONEYQUEST_ORDER_SIGNING_SECRET:"synthetic-signing-secret-for-browser-only-123456",MONEYQUEST_ORDER_DIRECTORY:orders,MONEYQUEST_DOWNLOAD_DIRECTORY:assets,MONEYQUEST_DOCUMENT_ROOT:docroot,MONEYQUEST_LIVE_RELEASE_FILE:releasePath,MONEYQUEST_SMTP_HOST:"smtp.merchant.test",MONEYQUEST_SMTP_PORT:"465",MONEYQUEST_SMTP_USER:"fixture",MONEYQUEST_SMTP_PASSWORD:"not-a-real-password",MONEYQUEST_SMTP_FROM:"orders@merchant.test",MONEYQUEST_STRIPE_FAMILY_PRICE_ID:"price_browser_family",MONEYQUEST_STRIPE_JOURNAL_PRICE_ID:"price_browser_journal",NEXT_PUBLIC_SITE_URL:"https://moneyquesteducation.com"}});
 await expect.poll(async()=>{try{return (await fetch(`${base}/api/health`)).status;}catch{return 0;}},{timeout:45000}).toBe(200);
});
test.afterAll(async()=>{if(child&&child.exitCode===null){child.kill("SIGTERM");await new Promise<void>(r=>{const t=setTimeout(()=>{child.kill("SIGKILL");r();},5000);child.once("exit",()=>{clearTimeout(t);r();});});}if(root)await rm(root,{recursive:true,force:true});});
test("synthetic live storefront requires four choices and surfaces safe payment errors",async({page})=>{
 let submitted:unknown=null;await page.route("**/api/shop/checkout",async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({code:"checkout_unavailable",message:"RAW INTERNAL FIXTURE ERROR"})});});
 await page.setViewportSize({width:320,height:900});await page.goto(`${base}/en/parents/shop`);
 await expect(page.getByText("Synthetic browser merchant",{exact:true})).toBeVisible();await expect(page.getByText("Test checkout only. No real money will be taken.",{exact:true})).toHaveCount(0);
 const card=page.locator("article#family-adventure-pack"),button=card.getByRole("button",{name:"Continue to secure payment",exact:true});await expect(button).toBeDisabled();
 const choices=card.getByRole("checkbox");await expect(choices).toHaveCount(4);for(let i=0;i<4;i++)await expect(choices.nth(i)).not.toBeChecked();
 for(let i=0;i<3;i++)await choices.nth(i).check();await expect(button).toBeDisabled();await choices.nth(3).check();await expect(button).toBeEnabled();await button.click();
 await expect(card.getByRole("status")).toHaveText("Checkout is unavailable. Please try later.");
 expect(submitted).toEqual({productId:"family-adventure-pack",adultPurchaser:true,instantSupply:true,cancellationAcknowledged:true,termsAccepted:true});await expect(page.getByText("RAW INTERNAL FIXTURE ERROR")).toHaveCount(0);
 await choices.nth(3).uncheck();await expect(button).toBeDisabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
});
test("synthetic live terms and privacy show the configured seller and full policy",async({page})=>{
 for(const [route,title] of [["terms","Digital download terms"],["privacy","Privacy and adult purchases"]]){
  await page.goto(`${base}/en/${route==="privacy"?"privacy":"parents/shop/terms"}`);await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
  await expect(page.getByText("Synthetic browser merchant",{exact:true})).toBeVisible();await expect(page.getByText(/Synthetic browser fixture\. Not a published legal policy\./).first()).toBeVisible();
  await expect(page.getByText(/no personal information anywhere|No real money is taken/i)).toHaveCount(0);
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
 }
});
test("invalid live download and receipt show a private accessible recovery page",async({page,request})=>{
 for(const kind of ["download","receipt"]){
  const response=await request.post(`${base}/api/shop/${kind}`,{headers:{Origin:"https://moneyquesteducation.com"},form:{token:"private-invalid-fixture-not-for-reflection",locale:"ro"}});
  expect(response.status()).toBe(403);expect(response.headers()["content-type"]).toContain("text/html");expect(response.headers()["cache-control"]).toContain("no-store");expect(response.headers()["x-robots-tag"]).toContain("noindex");
  const html=await response.text();expect(html).not.toContain("private-invalid-fixture-not-for-reflection");expect(html).not.toContain("Invalid download link");
  await page.setContent(html);await expect(page.locator("html")).toHaveAttribute("lang","en");await expect(page.getByRole("heading",{level:1})).toHaveText(kind==="download"?"Download unavailable":"Confirmation unavailable");
  await expect(page.getByText(/Do not pay again/)).toBeVisible();await expect(page.getByRole("link",{name:"Contact order support"})).toHaveAttribute("href","mailto:support@merchant.test");
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();expect(result.violations).toEqual([]);
 }
});
