import {readFile,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {privateDirectory} from "./private-path";
export const PARENT_BONUS_ID="little-minds-smart-money";
export type ParentBonusGrant={id:string;version:string;title:string;language:"en";file:string;sha256:string;bytes:number};
/** Original eight-page illustrated source. Never place this PDF in public/ or Git. */
export const PARENT_BONUS:Readonly<ParentBonusGrant>={
 id:PARENT_BONUS_ID,version:"2026-11-04",title:"Little Minds, Smart Money",language:"en",
 file:"parent-toolkit-little-minds-smart-money-1d3e2d2b3666562786cbeffdd413bb572d3fd29a0bf372df63f2b34261d93833.pdf",
 sha256:"1d3e2d2b3666562786cbeffdd413bb572d3fd29a0bf372df63f2b34261d93833",bytes:1662500
};
export function validateParentBonus(value:unknown):ParentBonusGrant{
 const grant=value as ParentBonusGrant;
 if(!grant||grant.id!==PARENT_BONUS_ID||grant.title!==PARENT_BONUS.title||grant.language!=="en"||!/^\d{4}-\d{2}-\d{2}$/.test(grant.version)||!/^[a-f0-9]{64}$/.test(grant.sha256)||grant.file!==`parent-toolkit-${PARENT_BONUS_ID}-${grant.sha256}.pdf`||!Number.isSafeInteger(grant.bytes)||grant.bytes<100||grant.bytes>20*1024*1024)throw new Error("Invalid private parent-guide entitlement");
 return grant;
}
export async function verifyParentBonus(directory:string,grant:ParentBonusGrant=PARENT_BONUS):Promise<Buffer>{
 validateParentBonus(grant);
 const target=privateDirectory(path.join(privateDirectory(directory),grant.file));
 const info=await stat(target);if(!info.isFile()||info.size!==grant.bytes)throw new Error("Private parent guide size mismatch");
 const bytes=await readFile(target);
 if(bytes.length!==grant.bytes||bytes.subarray(0,5).toString("ascii")!=="%PDF-"||createHash("sha256").update(bytes).digest("hex")!==grant.sha256)throw new Error("Private parent guide failed integrity verification");
 return bytes;
}
export async function parentBonusReady(directory:string){try{await verifyParentBonus(directory);return true;}catch{return false;}}
export function parentBonusMetadata(){return {bonus_id:PARENT_BONUS.id,bonus_version:PARENT_BONUS.version,bonus_sha256:PARENT_BONUS.sha256};}
export function sandboxBonus(metadata:Record<string,string>|null|undefined){
 const expected=parentBonusMetadata();return Object.entries(expected).every(([key,value])=>metadata?.[key]===value)?{...PARENT_BONUS}:undefined;
}
