import assert from "node:assert/strict";
import config from "../tailwind.config";
const palette=config.theme!.extend!.colors as Record<string,string>;
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const luminance=(hex:string)=>rgb(hex).reduce((sum,value,i)=>sum+(value<=.04045?value/12.92:((value+.055)/1.055)**2.4)*[.2126,.7152,.0722][i]!,0);
const blend=(ink:string,paper:string,opacity:number)=>"#"+rgb(ink).map((value,i)=>Math.round((value*opacity+rgb(paper)[i]!*(1-opacity))*255).toString(16).padStart(2,"0")).join("");
for(const token of ["teal-text","success-text","warning-text","error-text"])for(const surface of [palette.fog!,palette.cream!,"#ffffff",blend(palette.teal!,palette.fog!,.1)]){
 const a=luminance(palette[token]!),b=luminance(surface);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,`${token} contrast ${ratio.toFixed(2)} on ${surface}`);
}
console.log("PASS: semantic text tokens meet 4.5:1 on white, cream, sage and selected teal surfaces.");
