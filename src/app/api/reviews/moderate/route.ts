import {limitedBody} from "@/lib/security/limited-body";
import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {isSameOriginRequest} from "@/lib/security/same-origin";
import {moderateReview} from "@/lib/reviews/store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
  const headers={"Cache-Control":"no-store"};
  if(!isSameOriginRequest(request))return NextResponse.json({message:"Forbidden"},{status:403,headers});
  const expected=process.env.MONEYQUEST_REVIEW_MODERATION_KEY;
  const supplied=request.headers.get("authorization")?.replace(/^Bearer /,"")||"";
  if(!expected||expected.length<24||Buffer.byteLength(supplied)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return NextResponse.json({message:"Not authorised"},{status:401,headers});
  let text;try{text=await limitedBody(request,1000);}catch{return NextResponse.json({message:"Request too large"},{status:413,headers});}
  try{const value=JSON.parse(text);return NextResponse.json(await moderateReview(value.action,value.id),{headers});}catch{return NextResponse.json({message:"Moderation could not be completed."},{status:400,headers});}
}
