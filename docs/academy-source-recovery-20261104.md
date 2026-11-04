# Academy source recovery and remaining production work

The three original English paid PDFs have been recovered. No owner re-upload is required. The recovered files match all three hashes and byte counts in `content/printables/academy-originals.json`. The private English ZIP rebuilds byte-identically to its pinned manifest.

## Sources checked

- Full remote branch inventory and all tracked PDF, ZIP, manifest, release and Academy paths across those branches.
- Current main `88bf4d911969c5d003573333a7862bc044fb8b94`, Academy Originals integration and relevant printable branches/PRs #24 and #25.
- GitHub Releases collection, which currently contains no releases/assets.
- Existing project files and the owner's previously supplied `Money_Quest_Academy_Integration_EN_Pending_Translations.zip`.
- Original PDF Library identities already recorded in the source manifest.

The owner's integration ZIP contains the complete private paid English archive, not only its metadata. PRs #24/#25 contain a different design specification and English activity briefs. Substituting their text for these illustrated worksheets would silently change the product. No editable page sources or separate text-free illustrations were found in these inspected sources.

## Recovered material

| Edition | Worksheets | Source SHA-256 |
| --- | ---: | --- |
| Explorer, ages 6-8 | 20 | `bef67d10982a0cc7e3d68cfb7a29e57aa482616c4e331e1b1a322ac401078f43` |
| Builder, ages 9-11 | 20 | `89fc44353e4bfd4bb5177cfb7078d027414cbb7f8c446b2a17ed666df1cc4a63` |
| Strategist, ages 12-14 | 20 | `9b44f04e717b7a9b7e2fb50c0663ea158bf0a21028da76c2846c7acdff3bf10e` |

All 60 pages have one recoverable flattened illustration, 1312 x 1856 pixels, and no selectable text. Exact embedded images were extracted without resampling or changing their bytes. The public recovery inventory contains hashes and technical metadata only. Full paid page images, OCR and manuscripts stay outside Git and public/.

The original page boxes are 314.88 x 445.44 points, about 111 x 157 mm. Their aspect ratio fits A4, but they are not physically A4 PDFs. Final reconstructed editions need A4 page boxes. The supplied art provides about 159 pixels per inch when expanded to A4; changing metadata to 300 dpi would not add detail.

Reproduce private recovery:

```sh
python3 scripts/recover-academy-originals.py --source-dir /private/originals --output-dir /private/new-recovery --ocr
```

The tool validates every source before writing anything, refuses public-repository output and existing output directories, preserves exact image bytes and marks every OCR result UNREVIEWED. It does not generate translated worksheets or change commercial readiness. The TSV reader treats quotation marks literally, preventing image text containing quotes from swallowing subsequent OCR rows.

## Editorial issues found during inspection

These are specific review findings, not a completed audit of every word on all 60 pages:

- Explorer page 4, third sum: the same coin displays both a small `£1` and a large `£2`. A final answer cannot depend on an ambiguous value.
- Explorer page 6: savings markers skip 4. The supplied drawing has nine marker circles labelled 1, 2, 3, 5, 6, 7, 8, 9, 10.
- Explorer page 9 asks for each item's real price without a stated price list. Treating one possible guess as the only correct answer would be unjustified.
- Explorer page 1's illustrative banknote combines inconsistent denomination/design details. It needs review before use as an accurate money-identification model.

Keep the owner-supplied masters unchanged. Reconstructed customer editions need a documented correction log and corresponding answer guidance. Preserve correct art; correct only demonstrably misleading details. OCR is not a verified manuscript.

## Release state

The three supplied English PDFs are available. None of the 24 translated full activity PDFs has passed reconstruction, translation and visual validation in this work. The 27-PDF/540-worksheet-page deliverable is unfinished. Keep the Academy product's `releaseReady` false and preserve its server-side purchase block. The nine-language journal is a separate completed file set; its completion does not certify these activities.

Still required: verified text transcription and artwork corrections, eight translations of every worksheet, all A4 layouts and appropriate answer guidance, visual inspection of all final pages, secure final archive packaging, hashes and private delivery-manifest updates. The recovery script and metadata do not replace those deliverables.

## Full Explorer source review and Romanian authoring checkpoint

All twenty Explorer page images were then inspected individually at full resolution. A private checked English transcription records instructions, labels, embedded scene text, example values, answer guidance and an explicit correction plan. Romanian editorial copy now covers all twenty pages. This is manuscript work, not a completed translated PDF pack: A4 reconstruction and final visual validation remain outstanding.

Additional concrete issues found during this review:

- Page 1 needs to distinguish cash from a payment card that accesses money in an account.
- Page 7 must specify equal quantities as well as equal quality for its price comparison.
- Page 10 has six product cards but only five price labels.
- Page 16's supplied green ticks and red crosses reveal the intended answers; customer worksheets should not pre-mark them.
- Page 17 forces a unique morning/evening split, although brushing teeth belongs in both and other routines vary.
- Page 18 needs explicit scenario captions so safety is judged from the action described, rather than an adult's mere presence in a drawing.
- Page 20 supplies a five-stop trail but no dice or movement rules. Describe it as a trail rather than imply unspecified board-game rules.

The private authoring checkpoint is saved as `Academy_Explorer_Source_Translation_Workbench_20261104.zip`, 11,279 bytes, SHA-256 `edd1783565eed2ef5a877c824a3ff361962884588eee8fcb0d81ffbe38241afb`, Library file `libfile_528eee3d77f08191b61abaac5de28bb6`. It contains the two manuscripts and an explicit unfinished-status README. Full paid text and source images remain outside Git/public directories. The pinned English masters and existing product readiness flags are unchanged.
