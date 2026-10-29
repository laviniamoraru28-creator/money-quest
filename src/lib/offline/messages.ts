import type {SiteControlsCopy} from "@/content/site-controls-copy";
import {formatLocalizedText} from "@/lib/i18n/format-text";
import type {Locale} from "@/i18n/config";
export const OFFLINE_ERROR_COPY={
 busy:"busy",list_unavailable:"listUnavailable",language_unavailable:"languageUnavailable",
 invalid_path:"invalidPath",file_unavailable:"fileUnavailable",storage_full:"storageFull",
 timeout:"timeout",setup_not_ready:"setupNotReady",download_failed:"downloadFailed"
} as const;
export type OfflineErrorCode=keyof typeof OFFLINE_ERROR_COPY;
type WorkerStatus={type:"progress";done:number;total:number}|{type:"ready";count:number}|{type:"error";code:OfflineErrorCode};
export type OfflineStatus=WorkerStatus|{type:"preparing"|"removed"|"removeFailed"};
const failure:WorkerStatus={type:"error",code:"download_failed"};
export function offlineExceptionCode(error:unknown):OfflineErrorCode {
 const name=error&&typeof error==="object"&&"name" in error?error.name:undefined;
 return name==="QuotaExceededError"?"storage_full":name==="AbortError"?"timeout":"download_failed";
}
/** Older installed workers can finish after a UI upgrade. Never display their raw English errors. */
export function parseOfflineWorkerMessage(value:unknown):WorkerStatus|null {
 if(!value||typeof value!=="object")return null;
 const data=value as Record<string,unknown>;
 if(data.type==="progress"){
  const {done,total}=data;
  return typeof done==="number"&&Number.isSafeInteger(done)&&done>=0&&typeof total==="number"&&Number.isSafeInteger(total)&&total>0&&done<=total?{type:"progress",done,total}:failure;
 }
 if(data.type==="ready")return typeof data.count==="number"&&Number.isSafeInteger(data.count)&&data.count>0?{type:"ready",count:data.count}:failure;
 if(data.type!=="error")return null;
 if(typeof data.code==="string"&&Object.hasOwn(OFFLINE_ERROR_COPY,data.code))return {type:"error",code:data.code as OfflineErrorCode};
 const message=typeof data.message==="string"?data.message:"";
 const legacy:[string,OfflineErrorCode][]=[
  ["A download is already running in another window.","busy"],
  ["The offline download list is unavailable.","list_unavailable"],
  ["This language does not have a prepared offline copy yet.","language_unavailable"],
  ["Invalid offline download path.","invalid_path"],
  ["Could not save ","file_unavailable"],
  ["Offline setup is not ready.","setup_not_ready"]
 ];
 return {type:"error",code:legacy.find(([prefix])=>message.startsWith(prefix))?.[1]??"download_failed"};
}
export function offlineStatusText(locale:Locale,status:OfflineStatus|null,copy:SiteControlsCopy) {
 if(!status)return "";
 if(status.type==="progress")return formatLocalizedText(copy.progress,locale,{done:status.done,total:status.total});
 if(status.type==="ready")return formatLocalizedText(copy.complete,locale,{count:status.count});
 if(status.type==="error")return copy[OFFLINE_ERROR_COPY[status.code]];
 return copy[status.type];
}
