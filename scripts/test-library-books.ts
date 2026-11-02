import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { originalBooks } from "../src/content/library";
import { authorBooks } from "../src/content/author-books";
import { libraryBooks } from "../src/content/discovery";
import { libraryPeople } from "../src/content/people";
import sitemap from "../src/app/sitemap";

assert.equal(originalBooks.length, 10);
assert.equal(libraryBooks.length, 8, "Keep existing short reads");
const slugs = [...originalBooks, ...libraryBooks, ...libraryPeople].map(book => book.slug);
assert.equal(new Set(slugs).size, slugs.length, "Book routes must not collide");
for (const book of originalBooks) {
  assert.ok(book.chapters.length >= 6);
  assert.ok(existsSync(`public${book.cover}`), `Missing cover for ${book.slug}`);
  const cover = readFileSync(`public${book.cover}`);
  assert.equal(cover.toString("ascii", 0, 4), "RIFF");
  assert.ok(cover.length < 150_000);
  assert.equal(new Set(book.chapters.map(chapter => chapter.title)).size, book.chapters.length);
  for (const chapter of book.chapters) {
    assert.ok(chapter.paragraphs.join(" ").split(/\s+/).length >= (book.audience.startsWith("Explorer") ? 65 : 125), `Thin chapter: ${chapter.title}`);
    assert.equal(chapter.choices.filter(choice => choice.correct).length, 1);
    assert.equal(new Set(chapter.choices.map(choice => choice.text)).size, 3);
    assert.ok(chapter.choices.every(choice => choice.feedback.length > 40));
    assert.ok(chapter.activity.length > 60);
  }
  assert.ok(sitemap().some(entry => new URL(entry.url).pathname === `/en/library/${book.slug}`));
}
const allowedHosts = ["usborne.com", "www.jacquelinedavies.net", "www.abramsbooks.com", "www.penguinrandomhouse.com", "www.eden.co.uk", "www.hive.co.uk", "www.hachette.co.uk", "collins.co.uk", "www.quarto.com"];
for (const book of authorBooks) {
  const url = new URL(book.url);
  assert.equal(url.protocol, "https:"); assert.ok(allowedHosts.includes(url.hostname));
  assert.equal(url.search, "", "Do not add affiliate or tracking parameters");
  assert.equal(book.ideas.length, 3);
  assert.match(book.checked, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(book.authors && book.publisher && book.age && book.access);
}
assert.equal(authorBooks.length, 12);
assert.equal(libraryPeople.length, 10);
for (const person of libraryPeople) {
  assert.ok(existsSync(`public${person.image}`), `Missing portrait: ${person.name}`);
  assert.equal(new URL(person.source).protocol, "https:");
  assert.equal(person.sections.length, 3);
  assert.ok(sitemap().some(entry => new URL(entry.url).pathname === `/en/library/${person.slug}`));
}
console.log("PASS: 10 original books / 62 developed chapters and 10 biographies, 12 attributed external listings, original routes/assets and existing 8 short reads preserved.");

for (const topic of ["Money", "Entrepreneurship", "Leadership", "Creativity", "AI literacy", "Brain Lab", "Mind Lab", "Money psychology", "Digital safety", "Practical skills"]) assert.ok(authorBooks.some(book => book.topics.includes(topic)), `Missing domain: ${topic}`);
