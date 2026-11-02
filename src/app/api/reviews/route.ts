import {limitedBody} from "@/lib/security/limited-body";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/lib/security/same-origin";
import {publicReviews,submitReview,validateReview} from "@/lib/reviews/store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function GET(){try{return NextResponse.json(await publicReviews(),{headers});}catch{return NextResponse.json({message:"Public reviews are not available yet."},{status:503,headers});}}
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return NextResponse.json({message:"Please submit from Money Quest."},{status:403,headers});
  let text;try{text=await limitedBody(request,4000);}catch{return NextResponse.json({message:"Request too large"},{status:413,headers});}
  let data;try{data=validateReview(JSON.parse(text));}catch(error){return NextResponse.json({message:error instanceof Error?error.message:"Check your rating and comment."},{status:400,headers});}
  try{return NextResponse.json(await submitReview(data),{status:201,headers});}catch{return NextResponse.json({message:"Feedback could not be saved. Please try again later."},{status:503,headers});}
}
