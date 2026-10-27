# Museum and Library integration status

Branch: `feature/museum-library`. This is a work-in-progress branch. Do not merge or deploy without tests and editorial review.

## Added
- Ten Museum room records and eight Library book records in `src/content/discovery.ts`.
- Responsive Museum and Library indexes and detail pages in `src/app/[locale]/`.
- Client-side reading, optional browser speech synthesis, text enlargement, three-answer quizzes and local completion tracking in `src/components/DiscoveryExperience.tsx`.

## Release blockers
1. Run `npm run typecheck`, `npm run build`, and browser tests against the branch. These have NOT yet passed.
2. Add visible entry links from the website homepage and public navigation.
3. Add correct page-level canonical metadata and sitemap entries. The locale layout currently supplies homepage canonical metadata that can be inherited by nested pages.
4. Review all 18 entries for historical accuracy, educational depth, reading level and child accessibility.
5. Test speech synthesis on browsers and devices, including unsupported-browser behaviour.
6. Test keyboard focus, screen readers, mobile layout, localStorage failure, navigation and progress persistence.
7. Add original illustrations, richer exhibits, source references for biographies and more varied interactions.
8. Review locale routing. Current educational content is English only, despite multiple locale routes.

## Content scope
These are initial short stories and room descriptions, not fully illustrated books or interactive museum exhibits. Each room has one quiz and activity; each book has three short pages and one quiz.

## Safety
No account is required. Progress is stored only in the current browser. This branch has not been deployed.
