# Curriculum-linked printable catalogue

The shop now describes three separate English editions: Preschool, supported/SEND without an age assumption, and older children. Each activity edition has 20 activities in two visual versions and a seven-page grown-up guide. Each journal edition has 39 A4 pages over 12 undated weeks, in two visual versions, plus the guide.

The free family sample now demonstrates the same saving-for-a-ball concept in all three editions, followed by one adult guidance page. The journal sample contains the older edition's cover, introduction and first week. Product preview images are rendered from these actual sample PDFs. The old generic sample scenes are replaced.

The live Stripe account's existing product descriptions were aligned with these quantities. Product IDs, default price IDs and GBP 5.99 / 7.99 prices were retained. Metadata identifies the English curriculum review edition. This does not enable checkout or configure hosting credentials.

## Private customer bundles

Reader bundles are separate from the owner's editable-source archive. They contain PDFs and a START-HERE text file, with no source code, original illustration assets or credentials. They are not committed to this repository or included in public/offline content.

| Product | Filename | Bytes | SHA-256 | PDF files |
| --- | --- | ---: | --- | ---: |
| Activities | money-quest-family-pack-en.zip | 22737284 | 8bebd103b0d4b15567a18d213c54be52b07a0c45c23f3be1d3412f7e3b272b1d | 53 |
| Journal | money-quest-journal-en.zip | 14422827 | c5169fb839ee69f10e99f2a708b01959320998263815139c91f81e17e37d5c1d | 13 |

The activity count includes 40 individual older-child PDFs, which repeat activities also present in the complete PDFs. Shared cards, cut-and-stick pages, lesson map and calibration guide appear in both bundles. These are review bundles, not an approved live-release manifest.

The changed quantity facts were aligned in the existing eight non-English catalogue drafts. Their editorial status and English-only public routing remain unchanged. No translated printable files are claimed.

## Validation

- Node 24.22.1 typecheck and production build passed, including the offline manifest.
- Catalogue presentation checks passed: nine locales, 18 component renders, source fingerprints, structural checks and commerce gates.
- Parent flow and live-commerce unit checks passed. These use synthetic payment/SMTP fixtures; they are not evidence of a real purchase.
- All nine sample PDF pages were rendered and visually inspected. A4 text bounds checks reported zero issues.
- Both private ZIPs passed integrity tests, contain the intended 53/13 PDFs, and stay below the delivery code's 100 MiB limit.

## Remaining hosting work

Keep these bundles outside public/ in MONEYQUEST_DOWNLOAD_DIRECTORY. Use their exact hashes and sizes when preparing the final private release configuration. Live delivery uses content-addressed archive names; do not substitute the owner's full source archive for either customer bundle. Merchant policies, secure server credentials, webhook and durable email delivery still require the hosting setup described in live-commerce-readiness-20261030.md. Do not infer a successful deployment or completed card purchase from this catalogue PR.
