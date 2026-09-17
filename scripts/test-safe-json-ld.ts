/** Run with: npx tsx scripts/test-safe-json-ld.ts */
import { safeJsonLd } from "../src/lib/seo/safe-json-ld";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

// --- The actual attack: a value containing a literal </script> tag ---
const malicious = { headline: "Normal title</script><script>alert(document.cookie)</script>" };
const escaped = safeJsonLd(malicious);

check("Escaped output contains no literal '</script>' sequence", !escaped.includes("</script>"));
check("Escaped output contains no literal '<script>' sequence either", !escaped.includes("<script>"));
check("The data itself is still recoverable by JSON.parse (escaping doesn't corrupt the payload)", JSON.parse(escaped).headline.includes("alert(document.cookie)"));

// --- Confirm normal, non-malicious content round-trips unchanged in meaning ---
const normal = { headline: "Saving Money for Kids", audience: ["parents", "families"] };
const normalEscaped = safeJsonLd(normal);
check("Ordinary content parses back to an identical object", JSON.stringify(JSON.parse(normalEscaped)) === JSON.stringify(normal));

// --- Plain JSON.stringify is confirmed VULNERABLE, proving this isn't a theoretical fix ---
const unsafeOutput = JSON.stringify(malicious);
check("Sanity check: plain JSON.stringify() (the old behaviour) WOULD have left </script> intact — confirms the bug was real", unsafeOutput.includes("</script>"));

console.log(failures === 0 ? "\n✅ All JSON-LD escaping checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
