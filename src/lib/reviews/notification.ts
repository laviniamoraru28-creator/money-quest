import {createHmac,timingSafeEqual} from "node:crypto";
import nodemailer from "nodemailer";
import {smtpConfig} from "@/lib/commerce/config";
import {getSiteUrl} from "@/lib/seo/site-url";
import {pendingReviewNotifications,markReviewNotified} from "./store";

function secret(){const key=process.env.MONEYQUEST_REVIEW_MODERATION_KEY;if(!key||Buffer.byteLength(key)<32)throw new Error("Review moderation is not configured");return key;}
export function reviewToken(id:string,now=Date.now()) {
 const data=`${id}.${Math.floor(now/1000)+30*86400}`;
 return `${data}.${createHmac("sha256",secret()).update(data).digest("base64url")}`;
}
export function reviewTokenId(token:string,now=Date.now()):string|null {
 const parts=token.split(".");if(parts.length!==3)return null;
 const [id,expires,signature]=parts as [string,string,string];
 if(!/^[a-f0-9-]{36}$/.test(id)||!/^\d{10}$/.test(expires)||Number(expires)<now/1000)return null;
 const expected=createHmac("sha256",secret()).update(`${id}.${expires}`).digest("base64url");
 return signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected))?id:null;
}
type Mail={from:string;to:string;subject:string;text:string};
/** Persist first. Failed email remains in the private queue for a later retry. */
export async function notifyPendingReviews(send?:(mail:Mail)=>Promise<unknown>,id?:string) {
 const smtp=smtpConfig();secret();
 const transport=send?null:nodemailer.createTransport({...smtp,logger:false,debug:false,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,tls:{rejectUnauthorized:true}});
 let count=0;
 try {for(const review of (await pendingReviewNotifications()).filter(review=>!id||review.id===id).slice(0,25)) {
  const link=`${getSiteUrl()}/en/reviews/moderate?token=${encodeURIComponent(reviewToken(review.id))}`;
  const mail={from:smtp.from,to:"moneyquesteducation@gmail.com",subject:"Money Quest: recenzie nouă pentru aprobare",text:`Ai primit o recenzie nouă: ${review.rating}/5.\n\n${review.comment||"Fără comentariu."}\n\nRecenzia și stelele rămân private până la aprobarea ta. Deschide pagina pentru a accepta sau respinge:\n${link}\n\nLinkul expiră în 30 de zile. Deschiderea lui nu publică recenzia.`};
  if(send)await send(mail);else await transport!.sendMail(mail);
  await markReviewNotified(review.id);count++;
 }}finally{transport?.close();}
 return count;
}
