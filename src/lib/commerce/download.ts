import {commerceConfig} from "./config";
import {parseOrderToken,readOrder,validSessionId} from "./orders";
import {findProduct} from "@/content/shop";
import {paidSession} from "./stripe";
import {confirmationSent} from "./confirmation";
export async function authorisedOrder(token:string){
 const config=commerceConfig();const parsed=parseOrderToken(token,config.signing);
 if(!validSessionId(parsed.id,config.mode))throw new Error("Wrong payment environment");
 const order=await readOrder(config.orders,parsed.id);
 if(!order||order.expires!==parsed.expires)throw new Error("Order not found");const product=findProduct(order.productId);if(!product||(!order.contract&&order.amount!==product.price))throw new Error("Invalid product");
 await paidSession(order.sessionId);
 if(config.mode==="live"&&!await confirmationSent(config.orders,order.sessionId))throw new Error("Order confirmation pending; retry shortly without paying again");
 return {config,order,product};
}
