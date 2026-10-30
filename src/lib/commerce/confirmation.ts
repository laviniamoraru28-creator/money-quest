import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import nodemailer from "nodemailer";
import {commerceLock} from "./lock";
import {smtpConfig,type CommerceConfig} from "./config";
import {orderToken,validSessionId,type Order} from "./orders";
import {validEmail} from "./release";
export function confirmationText(order:Order,origin:string,signing:string){
 const c=order.contract;
 if(!c)throw new Error("Immutable order contract is required");
 return `MONEY QUEST ORDER CONFIRMATION\n\nSeller: ${c.merchant.name}\nAddress: ${c.merchant.address}\nSupport and complaints: ${c.merchant.email}\n\nProduct: ${c.title}\n${c.description}\n${c.pages}\nIncluded:\n${c.includes.map(item=>"- "+item).join("\n")}\nOrder communication language: English. File editions are listed in Included above.\nTotal paid: ${new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(order.amount/100)} GBP\nTax information: ${c.taxStatement}\nOrder: ${order.sessionId}\nDate: ${new Date(order.created).toISOString()}\nTerms version accepted: ${order.termsVersion}\n\nDigital PDF files in a ZIP archive. No printed product, shipping or subscription. You print and bind at home; printing and binding costs are not included. A PDF reader and ZIP-opening software are needed. Household licence only.\n\nAdult household purchaser confirmed: yes.\nImmediate digital supply expressly requested: yes.\nAcknowledgement of loss of the change-of-mind cancellation right once digital supply begins: yes. Statutory rights for faulty or misdescribed digital content remain.\n\nDownload and recovery link (keep private): ${origin}/en/parents/shop/download#token=${orderToken(order,signing)}\nLink expires: ${new Date(order.expires).toISOString()}\nSave this confirmation and your downloaded files. You may download again while the link and payment remain valid. Contact the seller above for support or recovery after expiry.\n\nFULL ACCEPTED TERMS\n${c.termsText}\n\nORDER PRIVACY INFORMATION\n${c.privacy}\n`;
}
export function confirmationMarker(directory:string,id:string){if(!validSessionId(id))throw new Error("Invalid order reference");return path.join(directory,`${id}.confirmation.json`);}
export async function confirmationSent(directory:string,id:string){try{const m=JSON.parse(await readFile(confirmationMarker(directory,id),"utf8"));return m.sessionId===id&&Number.isSafeInteger(m.sent);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return false;throw e;}}
export type MailSender=(mail:{from:string;to:string;replyTo:string;subject:string;text:string;messageId:string})=>Promise<{accepted:unknown[];rejected:unknown[]}>;
export async function sendOrderConfirmation(config:CommerceConfig,order:Order,email:string,send?:MailSender){
 if(config.mode!=="live"||order.mode!=="live"||!order.contract)throw new Error("Live confirmation requires a matching order");
 if(!validEmail(email))throw new Error("Adult purchase email missing");
 if(await confirmationSent(config.orders,order.sessionId))return;
 await mkdir(config.orders,{recursive:true,mode:0o700});
 const unlock=await commerceLock(confirmationMarker(config.orders,order.sessionId));
 try{
  if(await confirmationSent(config.orders,order.sessionId))return;
  const smtp=smtpConfig(),digest=createHash("sha256").update(order.sessionId).digest("hex"),domain=new URL(config.origin).hostname;
  const mail={from:smtp.from,to:email,replyTo:order.contract.merchant.email,subject:`Money Quest: ${order.contract.title}`,text:confirmationText(order,config.origin,config.signing),messageId:`<mq-${digest}@${domain}>`};
  const transporter=send?null:nodemailer.createTransport({...smtp,logger:false,debug:false,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,tls:{rejectUnauthorized:true}});
  const result=send?await send(mail):await transporter!.sendMail(mail);
  if(result.rejected.length||!result.accepted.length)throw new Error("Confirmation email not accepted");
  const temporary=confirmationMarker(config.orders,order.sessionId)+".tmp";
  await writeFile(temporary,JSON.stringify({sessionId:order.sessionId,sent:Date.now(),messageId:mail.messageId}),{flag:"w",mode:0o600});
  await rename(temporary,confirmationMarker(config.orders,order.sessionId));
 }finally{await unlock();}
}

export async function verifyConfirmationTransport(){const smtp=smtpConfig(),transport=nodemailer.createTransport({...smtp,logger:false,debug:false,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,tls:{rejectUnauthorized:true}});try{await transport.verify();}finally{transport.close();}}
