# ViewLingo Changelog

## Version 2.5.0 (September 2026)

### Languages
- Search languages in Settings by their name in your app language, their own name, or their code, and add them straight from the results
- Your chosen regional English target (for example British English) is kept instead of falling back to a default
- Regional source variants that recognize text the same way are shown as one choice; Simplified and Traditional Chinese stay separate
- Clearer guidance for choosing screen languages and downloading language packs in Settings and first-run setup

### Live Mode & Display
- When the original text changes, the previous Live translation is removed instead of being reused for the new text
- Translucent translated text is drawn once, with a cleaner outline, so letters no longer look doubled

## Version 2.4.4 (September 2026)

- Close, Retry and Live stay available when a selected area contains no text
- More reliable switching between Live translation, Retry and resizing
- Settings, permission prompts and language-pack downloads stay reachable while a translation window is open
- Setup restores your progress and language choices, including after a cancelled download

## Version 2.4.3 (September 2026)

- Fixed removed text sometimes remaining visible during Live translation
- Target-language regional variants are organized into submenus, keeping every supported choice
- New shortcut test, and a way to reopen Quick Start without resetting settings
- Quick Start can start a translation directly, with clearer Screen Recording permission guidance

## Version 2.4.2 (September 2026)

- Better recognition of small and vertical text in wide selections
- Escape reliably cancels screen-region selection
- Translated text is no longer shrunk when there is enough room
- Stronger text contrast on translucent overlays, including small text
- More consistent results when text changes during Live translation

## Version 2.4.1 (September 2026)

- Better readability on dark screens and when the background changes during Live translation
- Old translations no longer stay visible after the text disappears from the screen
- Automatically detected languages keep their result instead of being translated again and again
- Better paragraph wrapping, with access to the full text of longer translations
- Optional masking of the original text that respects your transparency settings
- Less waiting when the translation service stops responding, with an automatic retry

## Version 2.4.0 (August 2026)

### Viewfinder
- **Lock mode**: lock the viewfinder from the menu bar and every click and drag passes through to the app underneath — scroll the page or use video controls while Live translation keeps running on top. Esc once unlocks, twice closes
- Resizing now only happens in a narrow band along the border, so moving the viewfinder no longer turns into resizing
- The viewfinder no longer sits over the macOS menu bar

### Languages & Setup
- The language-pack download prompt only appears for languages on your list, and remembers when you decline
- First-run setup no longer blocks until every language pack is installed — start with what you have and download packs in-app

### Live Mode
- Fixed a case where a translation that had just finished was discarded instead of shown
- Overlays now adapt to dark content: on dark video or dark-mode pages, the translation band renders dark with light text instead of a light band with black text

## Version 2.3.0 (July 2026)

### Languages
- Language lists now show each language's own name alongside its name in your app language (e.g. "ไทย (Thai)")
- Fixed a stale cache that could hide supported languages behind a short fallback list — the likely cause of "please add Russian/Turkish" reports for languages that already worked
- Language pack installs are now picked up as soon as you return from System Settings
- Source-language list shows one row per language instead of one per regional variant (nine rows for English alone)
- Japanese is no longer mistaken for Traditional Chinese — everyday kanji no longer count as evidence of Chinese

### Performance
- First translation is faster: translation models now warm up at app launch with your actual language configuration
- Translations stream in as they finish instead of waiting for the whole capture, so dense screens fill in progressively
- Live Mode is calmer on video: capture pacing and re-translation debounce adapt to sustained high-change content, reducing flicker and heat
- Live Mode only re-translates changed segments; cached results render immediately

### Improvements
- When a missing language pack silently blocks translation, ViewLingo now says which languages are needed and offers to open the settings
- The rating prompt no longer appears on top of a fresh translation

## Version 2.2.0 (May 2026)

### Performance
- Faster capture: the viewfinder region is captured directly instead of cropping a full-screen shot
- Parallelized batch translation
- Live Mode: adaptive capture cadence, fewer redundant overlay refreshes
- Settings window renders only the active tab

### Bug Fixes
- Wrapped lines of a sentence are merged before translation, while lists, menus and tables keep their structure
- Live Mode overlays stay readable on varied content (stricter contrast threshold, minimum background opacity)
- Viewfinder windows no longer hide behind other app UI in more cases
- Fixed false translation-cache hits from over-aggressive key normalization

## Version 2.1.0 (February 2026)

### New Features
- **Vertical Text Rendering**: Full CJK vertical text support with automatic direction detection and Latin text rotation
- **Adaptive Font Sizing**: Smart font fitting for readable translations even with verbose language pairs (e.g., Japanese to English)
- **Control Double-Tap Shortcut**: fn+Control double-tap to instantly create a viewfinder with previous size
- **Table Layout Detection**: Automatic table structure recognition with preserved row/column layout

### Performance Improvements
- Dramatically faster text rendering with optimized font fitting engine
- Faster overlay updates with improved segment matching
- Instant translation response with optimized capture pipeline
- Improved memory management and view pool efficiency

### Bug Fixes
- Fixed Live mode text becoming invisible on dark backgrounds
- Fixed Live mode overlay backgrounds showing dense gray instead of matching page content
- Fixed Live mode empty text boxes and transparent background issues
- Fixed pixel-to-point coordinate conversion for more accurate overlays
- Fixed viewfinder corner clipping visual artifacts
- Normalized overlay text alignment for cleaner appearance

### UI/UX Improvements
- Improved overlay background opacity (70%) for better readability
- Clean rounded corners on all viewfinder layers
- Multiple keyboard shortcut options (configurable in Settings)

## Version 1.2.0 (August 2025)

### Bug Fixes
- Fixed screen capture resource leak that could interfere with other screen sharing apps
- Fixed viewfinder not showing translations after quick creation
- Resolved race condition during viewfinder initialization

### Stability Improvements
- Improved memory management and resource cleanup
- Enhanced concurrency handling for more reliable operation

## Version 1.1.0 (August 2025)

### Performance Improvements
- Dramatically improved Live mode performance
- Reduced memory usage by up to 60%
- Better handling of streaming content

### Bug Fixes
- Fixed Japanese text detection in Live mode
- Fixed viewfinder getting stuck after force stop
- Fixed infinite loading on video sites
- Improved keyboard shortcut reliability

### Enhancements
- Better support for small text and subtitles
- More stable Live mode for extended use
- Clearer error messages and helpful tips

## Version 1.0.0 (July 2025)

### Initial Release
- Viewfinder translation with AR overlay
- Live translation mode
- Support for 10 languages
- 100% on-device privacy
- Native macOS design
