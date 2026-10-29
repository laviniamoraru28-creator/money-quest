import {test,expect} from "@playwright/test";
import {siteControlsCopy} from "../../src/content/site-controls-copy";

test("offline controls translate structured and older worker errors without exposing raw text",async({page,request})=>{
 await page.addInitScript(()=>{
  const outcomes=[{type:"error",code:"storage_full",message:"RAW UNTRANSLATED QUOTA ERROR"},{type:"error",message:"A download is already running in another window. Let it finish first."},{type:"error",code:"unknown_code",message:"RAW UNTRANSLATED INTERNAL ERROR"}];
  const active={postMessage(_value:unknown,ports:MessagePort[]){ports[0]!.postMessage(outcomes.shift());}};
  Object.defineProperty(navigator,"serviceWorker",{configurable:true,value:{register:async()=>({}),ready:Promise.resolve({active})}});
 });
 await page.goto("/en/library");
 const toolbar=page.getByRole("complementary",{name:"Page read-aloud",exact:true});
 await toolbar.getByText("Use without internet",{exact:true}).click();
 for(const message of [siteControlsCopy.en.storageFull,siteControlsCopy.en.busy,siteControlsCopy.en.downloadFailed]){
  await toolbar.getByRole("button",{name:"Download for offline use",exact:true}).click();
  await expect(toolbar.getByRole("status").filter({hasText:message})).toHaveText(message);
  await expect(toolbar.getByRole("button",{name:"Download for offline use",exact:true})).toBeEnabled();
 }
 await expect(page.getByText(/RAW UNTRANSLATED/)).toHaveCount(0);
 const activeFallback=await request.get("/offline-pages/en.html");expect(activeFallback.status()).toBe(200);expect(await activeFallback.text()).toContain('<html lang="en">');
 expect((await request.get("/offline-pages/ro.html")).status()).toBe(404);
});
