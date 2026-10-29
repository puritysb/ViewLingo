# Localized website media — October 29, 2026

The five homepages now each select their own hero demo, 27-second showreel,
settings card and use-case montage. Japanese and Simplified Chinese no longer
fall back to the English showreel. The Korean comparison walkthrough is no longer
the default secondary video on other-language pages. Earlier published assets
remain at their original URLs.

`manifest.json` records the showreels and cards; `use-cases-manifest.json` records
the restored document/game/video excerpts separately. The last 4.75 seconds of each original are excluded to remove the older general privacy card and old-icon ending; retained video packets are verified byte-for-byte against the source without re-encoding. These are website assets,
not replacements for the submitted App Store media. The use-case montages omit
the older privacy and closing-brand cards; the selected original video/audio
streams are retained without repainting app content. Some historical overlays
leave original text visible, which the page captions disclose.

## Showreels

- The opening uses the approved icon and a localized editorial title.
- The game excerpt retains actual Apple output in the page language. Japanese
  demonstrates Korean → Japanese; the other locales demonstrate Japanese → the
  page language. The Japanese source interval is 2.5–10.0 seconds so its completed translation
  stays readable; the other locales retain the reviewed 0.3–7.8 second interval.
  Excerpts run at original speed.
- The shared Live film excerpt translates Japanese sample captions into English;
  captions on each page disclose that example language. The Japanese reel instead
  uses an actual Japanese Live/document/game montage from the restored original.
  Film attribution remains visible: Big Buck Bunny © 2008 Blender Foundation,
  CC BY 3.0, demo captions added.
- English, Korean and Traditional Chinese retain the real 3.0 interactive
  onboarding recording. Japanese continues the actual Japanese montage; Simplified
  Chinese uses another real game Live excerpt instead of an English onboarding
  recording or a long static language-settings segment.
- All five end on the genuine localized translation settings. These are held
  screenshots, not simulated clicks or evidence of a DeepL request.

Settings source images are build 41 native layout captures. They use example
preferences. The two popover images are cropped to exclude the desktop, masked
at their rounded outer perimeter, and uniformly scaled; no UI text or translation
result is repainted. The Japanese and Simplified Chinese onboarding stills are
unchanged native usage-tip captures, with the language stated beside the image.

The first showreel attempt cut the Japanese game source before its translated
result was readable. It was rejected during frame review; the published candidates
extend that locale’s source interval to include the completed output. Other
locales retain their original timing because advancing their start introduces a
new scene before the final frame. Earlier attempts and
render intermediates are retained outside the public site.

## Verification

All showreels are fully decoded with ffmpeg and inspected at scene boundaries,
original/result frames, localized settings and posters. Output is 1920×1080,
30fps H.264 with silent AAC stereo; these silent, edited examples do not benchmark
translation latency. Posters are the exact one-second frames. Files and hashes
are guarded by `node --test tests/localized-media.test.cjs`.

## Brand spelling

New editorial badges and settings-card labels use **ViewLingo 3.0**, matching the
canonical product name in the website README. Uppercase styling must not change
the product spelling. This correction changes only editorial branding outside
the native app imagery; clip timing, capture content, posters and legacy montage
streams remain unchanged. Media revision `2026102903` refreshes cached video and
image URLs. The prior published render is preserved in the private edit history.
