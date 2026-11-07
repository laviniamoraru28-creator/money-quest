import {notifyPendingReviews} from "../src/lib/reviews/notification";
notifyPendingReviews().then(count=>console.log(`Sent ${count} pending review notifications.`)).catch(()=>{console.error("Review email delivery unavailable; pending reviews remain private.");process.exitCode=1;});
