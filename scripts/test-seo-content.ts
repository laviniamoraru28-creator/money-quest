/** Run with: npx tsx scripts/test-seo-content.ts */
import { ARTICLE_STRUCTURES, getArticleStructureBySlug } from "../src/content/articles";
import { getLocalizedArticle, getAllArticles } from "../src/lib/seo/get-article";
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqSchema } from "../src/lib/seo/structured-data";
import { LOCALES } from "../src/i18n/config";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

// --- No duplicate slugs (structural, locale-independent) ---
const slugs = ARTICLE_STRUCTURES.map((a) => a.slug);
check("No duplicate article slugs", new Set(slugs).size === slugs.length);

// --- Every relatedSlugs reference points to a REAL article ---
let allRelatedLinksValid = true;
for (const article of ARTICLE_STRUCTURES) {
  for (const relatedSlug of article.relatedSlugs) {
    if (!getArticleStructureBySlug(relatedSlug)) {
      console.log(`   ❌ "${article.slug}" links to non-existent related article "${relatedSlug}"`);
      allRelatedLinksValid = false;
    }
  }
}
check("Every relatedSlugs entry across every article points to a real article", allRelatedLinksValid);

// --- No article links to itself ---
let noSelfLinks = true;
for (const article of ARTICLE_STRUCTURES) {
  if (article.relatedSlugs.includes(article.slug)) noSelfLinks = false;
}
check("No article lists itself in its own relatedSlugs", noSelfLinks);

// --- Every audience array is non-empty (structural) ---
check("Every article declares at least one target audience", ARTICLE_STRUCTURES.every((a) => a.audience.length > 0));

async function main() {
  // --- Content-quality and completeness checks, run for EVERY supported
  //     locale now that articles are genuinely multilingual — not just
  //     English, which is all there was to check before. ---
  for (const locale of LOCALES) {
    const articles = await getAllArticles(locale);
    check(`${locale}: all ${ARTICLE_STRUCTURES.length} articles have localized content (none missing)`, articles.length === ARTICLE_STRUCTURES.length);

    let titlesReasonable = true;
    let descriptionsReasonable = true;
    let allSubstantive = true;
    for (const article of articles) {
      if (article.title.length > 80) {
        console.log(`   ❌ ${locale}/"${article.slug}" title is ${article.title.length} chars (recommended <=60-65, hard cap 80 to allow for longer languages)`);
        titlesReasonable = false;
      }
      if (article.metaDescription.length > 200 || article.metaDescription.length < 50) {
        console.log(`   ❌ ${locale}/"${article.slug}" meta description is ${article.metaDescription.length} chars (recommended 50-160, hard cap 200)`);
        descriptionsReasonable = false;
      }
      const totalParagraphs = article.sections.reduce((sum, s) => sum + s.paragraphs.length, 0);
      if (article.sections.length < 2 || totalParagraphs < 4) {
        console.log(`   ❌ ${locale}/"${article.slug}" looks thin: ${article.sections.length} sections, ${totalParagraphs} paragraphs`);
        allSubstantive = false;
      }
    }
    check(`${locale}: every article title is within recommended search-result length`, titlesReasonable);
    check(`${locale}: every article meta description is within recommended length`, descriptionsReasonable);
    check(`${locale}: every article has at least 2 sections and 4+ paragraphs (not a thin/stub page)`, allSubstantive);
  }

  // --- Structured data: only built from real content (English sample) ---
  const sample = await getLocalizedArticle("saving-money-for-kids", "en");
  if (!sample) {
    check("English sample article loads for structured-data checks", false);
  } else {
    const articleSchema = buildArticleSchema(sample, "https://moneyquest.app/en/learn/saving-money-for-kids");
    check("Article schema headline matches the real article title exactly", articleSchema.headline === sample.title);
    check("Article schema dates match the real article's own dates (never fabricated)", articleSchema.datePublished === sample.publishedDate);

    const faqSchema = buildFaqSchema(sample);
    check("FAQ schema question count matches the article's real faqs array exactly", faqSchema !== null && faqSchema.mainEntity.length === sample.faqs!.length);

    const articleWithNoFaqs = { ...sample, faqs: undefined };
    check("buildFaqSchema returns null (not an empty/fake schema) for an article with no real FAQs", buildFaqSchema(articleWithNoFaqs) === null);

    const breadcrumbs = buildBreadcrumbSchema([
      { name: "Home", url: "https://moneyquest.app/en" },
      { name: "Learn", url: "https://moneyquest.app/en/learn" },
      { name: sample.title, url: "https://moneyquest.app/en/learn/saving-money-for-kids" },
    ]);
    check("Breadcrumb schema has one ListItem per entry, in order", breadcrumbs.itemListElement.length === 3 && breadcrumbs.itemListElement[0].position === 1);
  }


  console.log(failures === 0 ? "\n✅ All SEO content checks passed." : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
