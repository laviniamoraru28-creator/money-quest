/** Install only the exact final guide, outside app/document root. No network calls. */
import {readFile,writeFile,rename,mkdir,rm} from "node:fs/promises";
import {createHash,randomBytes} from "node:crypto";
import path from "node:path";
import {privateDirectory} from "../src/lib/commerce/private-path";
import {PARENT_BONUS,verifyParentBonus} from "../src/lib/commerce/parent-bonus";
async function main(){
 const source=process.argv[2];if(!source||process.argv.length!==3)throw new Error("Pass the absolute path to the final illustrated PDF");
 if(!path.isAbsolute(source))throw new Error("Absolute source PDF path required");
 const directory=privateDirectory(process.env.MONEYQUEST_DOWNLOAD_DIRECTORY),file=await readFile(source);
 if(file.length!==PARENT_BONUS.bytes||createHash("sha256").update(file).digest("hex")!==PARENT_BONUS.sha256)throw new Error("Source does not match the verified eight-page illustrated guide");
 await mkdir(directory,{recursive:true,mode:0o700});
 const target=privateDirectory(path.join(directory,PARENT_BONUS.file)),temporary=privateDirectory(path.join(directory,`.parent-bonus-${randomBytes(8).toString("hex")}.tmp`));
 try{await writeFile(temporary,file,{flag:"wx",mode:0o600});await rename(temporary,target);await verifyParentBonus(directory);}finally{await rm(temporary,{force:true});}
 console.log("PASS: final illustrated English parent guide installed privately and integrity verified. No payment or email sent.");
}
main().catch(()=>{console.error("Parent guide installation blocked. Check the final PDF, private destination and document-root configuration.");process.exitCode=1;});
