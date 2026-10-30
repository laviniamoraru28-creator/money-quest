/** Bound streamed bodies as well as requests with a Content-Length header. */
export async function limitedBody(request:Request,maxBytes:number):Promise<string>{
  if(Number(request.headers.get("content-length"))>maxBytes)throw new Error("Request too large");
  if(!request.body)return "";
  const reader=request.body.getReader();const decoder=new TextDecoder();let bytes=0,text="";
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes){await reader.cancel();throw new Error("Request too large");}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
  finally{reader.releaseLock();}
}
