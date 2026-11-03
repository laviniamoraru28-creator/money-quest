# Quiet Corner animated assets: release checklist

This PR is **not ready to merge** until the binary assets are added and tested.

## Required files

Copy these exact files from `Money_Quest_Quiet_Corner_Integration.zip` into `public/images/money-quest/quiet/`:

| File | Approx. size | Purpose |
| --- | ---: | --- |
| `garden-v2.webp` | 551 KB | New static garden picture |
| `garden-animated.mp4` | 9.5 MB | Garden animation with sound |
| `ocean-animated.mp4` | 7.9 MB | Ocean animation with sound |
| `max-animated.mp4` | 3.5 MB | Max animation with sound |

The videos were inspected in the provided archive: H.264 video, AAC audio, 1280×720, approximately 10.24 seconds each.

## Expected behavior

1. The default is a static image. Nothing plays automatically.
2. **Move picture** plays the matching video in a loop, initially muted.
3. **Turn sound on** enables the video's original sound. **Mute sound** disables it.
4. **Keep still** stops video and audio.
5. Changing the selected picture stops the previous scene and mutes the next one.
6. **Reduced Motion** disables animation.
7. The global stop command and leaving the page stop playback.
8. Existing separate Pexels videos remain unchanged.

## QA before merge

- Confirm all four binary paths return HTTP 200 in preview.
- Check all three scenes on Android Chrome, iOS Safari, and desktop.
- Check no simultaneous sound with other Quiet Corner audio.
- Check all nine language labels and keyboard/screen reader operation.
- Run build, unit tests and browser tests.
- Confirm still-image fallback when media playback fails.
- Do not merge to `main` or deploy to Namecheap before checks pass.
