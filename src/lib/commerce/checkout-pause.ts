// New purchases are paused regardless of commerce configuration — set
// MONEYQUEST_CHECKOUT_PAUSED=false (alongside a real commerceConfig()) to
// resume without any other code change.
export function checkoutPaused(){return process.env.MONEYQUEST_CHECKOUT_PAUSED!=="false";}
