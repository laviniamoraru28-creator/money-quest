import path from "node:path";
import {realpathSync} from "node:fs";
export function privateDirectory(value:string|undefined):string{
 if(!value||!path.isAbsolute(value))throw new Error("An absolute private storage directory is required");
 const resolved=path.resolve(value),project=path.resolve(process.cwd());
 if(resolved===project||resolved.startsWith(project+path.sep))throw new Error("Paid downloads and orders must be outside the application directory");
 const publicRoot=process.env.MONEYQUEST_DOCUMENT_ROOT;
 if(publicRoot){
  if(!path.isAbsolute(publicRoot))throw new Error("Absolute document root required");
  const roots=[path.resolve(publicRoot)];try{roots.push(realpathSync(publicRoot));}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
  if(roots.some(root=>resolved===root||resolved.startsWith(root+path.sep)))throw new Error("Private commerce storage cannot be under the document root");
 }
 try{const actual=realpathSync(resolved);if(actual!==resolved)privateDirectory(actual);}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
 return resolved;
}
