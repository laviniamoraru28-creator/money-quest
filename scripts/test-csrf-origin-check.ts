/** Run with: npx tsx scripts/test-csrf-origin-check.ts */
import { isSameOriginRequest, type RequestLike } from "../src/lib/security/same-origin";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

function fakeRequest(originHeader: string | null, hostHeader: string | null): RequestLike {
  return {
    headers: {
      get(name: string) {
        if (name === "origin") return originHeader;
        if (name === "host") return hostHeader;
        return null;
      },
    },
  };
}

check(
  "Same-origin request (Origin matches Host) is allowed",
  isSameOriginRequest(fakeRequest("https://moneyquest.example", "moneyquest.example"))
);
check(
  "Cross-origin request (attacker.example posting to moneyquest.example) is rejected",
  !isSameOriginRequest(fakeRequest("https://attacker.example", "moneyquest.example"))
);
check(
  "A subtly different host (subdomain trick) is rejected",
  !isSameOriginRequest(fakeRequest("https://moneyquest.example.attacker.example", "moneyquest.example"))
);
check(
  "No Origin header at all is allowed (same-site navigations/non-browser clients don't always send one)",
  isSameOriginRequest(fakeRequest(null, "moneyquest.example"))
);
check(
  "Origin present but no Host header at all is rejected (fails closed, not open)",
  !isSameOriginRequest(fakeRequest("https://moneyquest.example", null))
);
check(
  "A malformed Origin header value doesn't crash the check and is rejected",
  !isSameOriginRequest(fakeRequest("not-a-valid-url", "moneyquest.example"))
);

console.log(failures === 0 ? "\n✅ All CSRF Origin-check tests passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
