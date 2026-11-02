import path from "node:path";
import {realpathSync,lstatSync,readlinkSync} from "node:fs";
/** Resolve existing parents too, before a not-yet-created order path is used. */
function canonicalPath(value:string):string{
 try{return realpathSync(value);}catch(error){
  if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
  try{
   if(lstatSync(value).isSymbolicLink())return canonicalPath(path.resolve(path.dirname(value),readlinkSync(value)));
  }catch(linkError){if((linkError as NodeJS.ErrnoException).code!=="ENOENT")throw linkError;}
  const parent=path.dirname(value);
  if(parent===value)throw error;
  return path.join(canonicalPath(parent),path.basename(value));
 }
}
export function privateDirectory(value:string|undefined):string{
 if(!value||!path.isAbsolute(value))throw new Error("An absolute private storage directory is required");
 const resolved=path.resolve(value),actual=canonicalPath(resolved),project=path.resolve(process.cwd());
 const inside=(candidate:string,root:string)=>candidate===root||candidate.startsWith(root+path.sep);
 if([project,canonicalPath(project)].some(root=>inside(resolved,root)||inside(actual,root)))throw new Error("Paid downloads and orders must be outside the application directory");
 const publicRoot=process.env.MONEYQUEST_DOCUMENT_ROOT;
 if(publicRoot){
  if(!path.isAbsolute(publicRoot))throw new Error("Absolute document root required");
  const roots=[path.resolve(publicRoot),canonicalPath(path.resolve(publicRoot))];
  if(roots.some(root=>inside(resolved,root)||inside(actual,root)))throw new Error("Private commerce storage cannot be under the document root");
 }
 return resolved;
}
