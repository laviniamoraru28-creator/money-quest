import {Adventure} from "@/components/Adventure";
export default async function AdventurePage({searchParams}:{searchParams:Promise<{band?:string}>}){
 const {band}=await searchParams;
 return <Adventure band={band==="builder"||band==="strategist"||band==="explorer"?band:undefined}/>;
}
