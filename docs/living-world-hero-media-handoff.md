# Living World Hero media handoff

The user-supplied 10-second video was optimized locally from 7.1 MB to approximately 984 KB, 960 px wide, muted. The chosen still is from 8 seconds, where all four labeled worlds and the three children are visible.

The code is intentionally guarded: if the video asset is not present, the existing Coin Cove thumbnail appears. The branch must NOT be merged or deployed as the final Living World experience until both media files are added and checked.

## Required files

- `public/videos/money-quest-hero.mp4`
- `public/images/money-quest/living-world-poster.webp`

Both files have been provided to the owner in `money-quest-hero-assets.zip`. The GitHub connector currently supports UTF-8 file creation, not uploading these binary files from the container. Do not replace the user video with generated imagery.

## Acceptance criteria

1. Upload the two exact files and verify the preview uses the original four-island video.
2. All four quest labels and three children are visible in the 8-second poster.
3. Desktop: video plays muted only when visible and motion preference permits it, with a functional pause control.
4. Mobile: show the four-world static poster, not an auto-playing video. Once assets are uploaded, update the mobile fallback image source from the Coin Cove thumbnail to the new poster.
5. Check network loading and LCP, contrast, keyboard, focus, reduced motion, all nine locales and 320–414 px layouts.
6. Confirm no extra analytics, child account or user-specific requests are introduced.
7. Keep the branch as a draft PR until assets and CI are verified.
