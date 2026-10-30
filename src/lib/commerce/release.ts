import {readFileSync,createReadStream} from "node:fs";
import {readFile,stat,mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {shopProducts,type ShopProduct} from "@/content/shop";
export type Release={schema:1;accountId:string;merchant:{name:string;address:string;email:string};terms:{version:string;text:string};privacy:string;taxStatement:string;products:Record<ShopProduct["id"],{sha256:string;bytes:number}>};
export type Contract={id:string;mode:"live";accountId:string;productId:ShopProduct["id"];title:string;description:string;pages:string;includes:string[];amount:number;currency:"gbp";priceId:string;termsVersion:string;termsText:string;merchant:Release["merchant"];privacy:string;taxStatement:string;archive:{file:string;sha256:string;bytes:number};created:number};
const emailPattern=/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
export function validEmail(value:unknown):value is string{return typeof value==="string"&&value.length<=254&&emailPattern.test(value)&&!/[\r\n]/.test(value);}
function text(value:unknown,min=1,max=20000):value is string{return typeof value==="string"&&value.trim().length>=min&&value.length<=max&&!/[\u0000\uFFFD]/.test(value);}
export function validateRelease(value:unknown):Release{
 const r=value as Release;
 if(!r||r.schema!==1||!/^acct_[A-Za-z0-9]+$/.test(r.accountId)||!text(r.merchant?.name,2,200)||!text(r.merchant?.address,10,1000)||!validEmail(r.merchant?.email)||!text(r.terms?.version,5,80)||/draft|preview|placeholder/i.test(r.terms.version)||!text(r.terms.text,300)||!text(r.privacy,100)||!text(r.taxStatement,20,1000)||!r.products)throw new Error("Live merchant, final terms, privacy and tax configuration required");
 if(/example\.(com|org|net)|\.invalid\b/i.test(r.merchant.email))throw new Error("A working merchant mailbox is required");
 for(const product of shopProducts){const asset=r.products[product.id];if(!asset||!/^([a-f0-9]{64})$/.test(asset.sha256)||!Number.isSafeInteger(asset.bytes)||asset.bytes<100||asset.bytes>100*1024*1024)throw new Error("Final private product manifest required");}
 if([r.merchant.name,r.merchant.address,r.terms.text,r.privacy,r.taxStatement].some(v=>/^(REPLACE|UNCONFIRMED|TODO)\b/i.test(v.trim())))throw new Error("Placeholder merchant policies cannot be published");
 return r;
}
export function readRelease(file:string){return validateRelease(JSON.parse(readFileSync(file,"utf8")));}
/** Immutable content-addressed archives keep old purchases independent of later releases. */
export function archiveName(product:ShopProduct,hash:string){if(!/^[a-f0-9]{64}$/.test(hash))throw new Error("Invalid archive fingerprint");return `${product.id}-${hash}.zip`;}
export function verifyArchive(directory:string,file:string,expected:{sha256:string;bytes:number}):Promise<Buffer>;
export function verifyArchive(directory:string,file:string,expected:{sha256:string;bytes:number},includeBytes:false):Promise<void>;
export async function verifyArchive(directory:string,file:string,expected:{sha256:string;bytes:number},includeBytes=true):Promise<Buffer|void>{
 if(path.basename(file)!==file||!file.endsWith(".zip"))throw new Error("Invalid private archive path");
 const target=path.join(directory,file),size=(await stat(target)).size;if(size!==expected.bytes||size>100*1024*1024)throw new Error("Private archive size mismatch");
 if(includeBytes){
  const bytes=await readFile(target);
  if(bytes.length!==expected.bytes||!bytes.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04]))||createHash("sha256").update(bytes).digest("hex")!==expected.sha256)throw new Error("Private product failed integrity verification");
  return bytes;
 }
 const digest=createHash("sha256");let first=true;
 for await(const chunk of createReadStream(target)){if(first){first=false;if(!(chunk as Buffer).subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04])))throw new Error("Invalid private ZIP");}digest.update(chunk);}
 if(first||digest.digest("hex")!==expected.sha256)throw new Error("Private product failed integrity verification");
}
export function validContractId(id:string){return /^[a-f0-9]{32}$/.test(id);}
export function validateContract(value:unknown):Contract{
 const c=value as Contract,product=shopProducts.find(p=>p.id===c?.productId);
 if(!c||!validContractId(c.id)||c.mode!=="live"||!product||!/^acct_[A-Za-z0-9]+$/.test(c.accountId)||!text(c.title)||!text(c.description)||!text(c.pages)||!Array.isArray(c.includes)||c.includes.length!==4||!c.includes.every(v=>text(v,1,1000))||!Number.isSafeInteger(c.amount)||c.amount<=0||c.currency!=="gbp"||!/^price_[A-Za-z0-9_]+$/.test(c.priceId)||!text(c.termsVersion)||!text(c.termsText,300)||!text(c.privacy,100)||!text(c.taxStatement,20)||!text(c.merchant?.name)||!text(c.merchant?.address)||!validEmail(c.merchant?.email)||!Number.isSafeInteger(c.created)||!c.archive||c.archive.file!==archiveName(product,c.archive.sha256)||!Number.isSafeInteger(c.archive.bytes)||c.archive.bytes<100||c.archive.bytes>100*1024*1024)throw new Error("Invalid private contract snapshot");
 return c;
}
export async function saveContract(directory:string,contract:Contract){validateContract(contract);await mkdir(directory,{recursive:true,mode:0o700});await writeFile(path.join(directory,`contract-${contract.id}.json`),JSON.stringify(contract),{flag:"wx",mode:0o600});}
export async function readContract(directory:string,id:string){if(!validContractId(id))throw new Error("Invalid contract reference");const c=validateContract(JSON.parse(await readFile(path.join(directory,`contract-${id}.json`),"utf8")));if(c.id!==id)throw new Error("Contract reference mismatch");return c;}
