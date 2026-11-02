# Money Quest visual identity — approved reference (27 October 2026)

## Locked art direction
Use a vivid, cinematic, friendly 3D cartoon illustration style: warm sunlight, expressive faces, richly detailed but legible fantasy locations, playful rounded forms, saturated yet harmonious colors. Keep educational text as accessible HTML overlays, not baked into generated art.

## Recurring guides
- Primary guide: cheerful school-age girl, wavy chestnut-brown hair, freckles, large warm brown eyes, purple hoodie with compass badge, small backpack.
- Companion: friendly small brown-and-white floppy-eared puppy with compass collar tag.
- Keep the **same character design and costume** in every lesson, world, activity and promo asset; no character redesign between scenes.
- The guide introduces lessons and offers brief, optional prompts; the dog adds warmth without distracting from tasks.
- No AI companion/chatbot functionality.

## Worlds
Coin Cove: tropical harbor, coins and treasure; Market Town: cheerful stalls and choices; Golden Vault: golden safe/vault interior and piggy bank, **same girl and puppy as all other worlds**; Sky Exchange: futuristic digital payments; Guardian Gate: protective castle and safety; Horizon Peaks: mountain adventure and planning; Kindness Grove: leafy garden and generosity.

## Production requirements
- Export individual optimized WebP/AVIF images, not cropped composite screenshots where text or borders are embedded.
- Art only: no labels, fake currency denominations, card numbers, logos, buttons, or instructional text inside illustrations.
- Pair visuals with short, child-friendly explanations and meaningful alt text; decorative images should have empty alt.
- Avoid excessive visual clutter, flashing, auto-playing movement or misleading visual representations.
- Use reduced-motion-safe transitions and ensure mobile-first layouts.
- Verify generated images before publishing (money examples must look like actual coins, banknotes, and payment instruments; cards/phones are payment methods, not money themselves).
- Keep all changes on feature branches until reviewed and tested.

## Integrated assets, 27 October 2026

The website completion branch commits original WebP binaries under `public/images/money-quest/`: `guides/`, `worlds/`, `money/` and `sections/`. The guide reference locks the girl and puppy. Seven worlds and six section illustrations use that exact reference as image input. Four standalone cash/payment illustrations support Coin Cove. Labels and explanations remain accessible HTML. Small thumbnails reduce map and guide downloads.

The earlier `money_quest_world_artwork.zip` was inspected and not integrated because it mixed boy/girl guides and different puppy designs. Existing artwork files are preserved. The new Golden Vault explicitly shows a golden safe interior with the same girl and puppy.

Money illustrations are simplified artistic representations, not authoritative banknote or coin identification guides. Account balance amounts are deterministic HTML. `docs/artwork-manifest.json` records committed production files, sizes, dimensions and SHA-256 hashes. These images depict authored scenes only; there is no interactive AI character.
