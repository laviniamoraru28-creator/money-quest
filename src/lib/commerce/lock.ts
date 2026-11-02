import {lock} from "proper-lockfile";
/** Shared lease settings for one persistent filesystem. Dead workers expire after two minutes. */
export function commerceLock(file:string){return lock(file,{realpath:false,stale:120000,update:20000,retries:{retries:3,minTimeout:100,maxTimeout:500}});}
