import {commerceConfig} from "./config";
import {parseOrderToken,readOrder} from "./orders";
import {findProduct} from "@/content/shop";
import {paidSession} from "./stripe";
export async function authorisedOrder(token:string){
 const config=commerceConfig();const parsed=parseOrderToken(token,config.signing);const order=await readOrder(config.orders,parsed.id);
 if(!order||order.expires!==parsed.expires)throw new Error("Order not found");const product=findProduct(order.productId);if(!product||order.amount!==product.price)throw new Error("Invalid product");
 await paidSession(order.sessionId);return {config,order,product};
}
