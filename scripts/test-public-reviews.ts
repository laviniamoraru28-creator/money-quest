import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {validateReview,submitReview,publicReviews,moderateReview} from "../src/lib/reviews/store";
async function main(){
  for(const data of [{rating:0,comment:""},{rating:6,comment:""},{rating:5,comment:"Email me at hello@example.com"},{rating:4,comment:"01234 567890"},{rating:3,comment:"<script>alert(1)</script>"},{rating:2,comment:"Nice",email:"secret"}])assert.throws(()=>validateReview(data));
  const dir=await mkdtemp(path.join(tmpdir(),"mq-reviews-"));process.env.MONEYQUEST_REVIEW_STORE_PATH=path.join(dir,"reviews.json");
  try{
    await Promise.all([submitReview({rating:5,comment:"Helpful pictures and clear instructions."}),submitReview({rating:3,comment:""})]);
    let data=await publicReviews();assert.equal(data.count,0);assert.equal(data.average,null);assert.equal(data.comments.length,0,"Unmoderated text must never be public");
    const pending=await moderateReview("list") as {id:string;rating:number}[];assert.equal(pending.length,2);
    assert.deepEqual(pending.map(review=>review.rating).sort(),[3,5]);
    await moderateReview("approve",pending.find(review=>review.rating===5)!.id);data=await publicReviews();assert.equal(data.comments.length,1);assert.equal(data.count,1);assert.equal(data.average,5);
    await moderateReview("reject",pending.find(review=>review.rating===3)!.id);assert.equal((await publicReviews()).count,1);
    const stored=JSON.parse(await readFile(process.env.MONEYQUEST_REVIEW_STORE_PATH,"utf8"));assert.deepEqual(Object.keys(stored).sort(),["comments","counts"]);assert.deepEqual(Object.keys(stored.comments[0]).sort(),["comment","id","rating","status"]);
  }finally{delete process.env.MONEYQUEST_REVIEW_STORE_PATH;await rm(dir,{recursive:true,force:true});}
  console.log("PASS: review validation, concurrent rating totals, private moderation queue, explicit approval and no name/IP/email fields.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
