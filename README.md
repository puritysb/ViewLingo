# ViewLingo - AR Screen Translator for Mac

Read any text on your Mac screen in your language, right where it appears.

🌍 Language: **English** | [한국어](docs/README-ko.md) | [日本語](docs/README-ja.md) | [简体中文](docs/README-zh-Hans.md) | [繁體中文](docs/README-zh-Hant.md) | [ไทย](docs/README-th.md) | [Español](docs/README-es.md) | [Français](docs/README-fr.md) | [Deutsch](docs/README-de.md) | [Tiếng Việt](docs/README-vi.md)

[![macOS](https://img.shields.io/badge/macOS-15.0+-blue)](https://www.apple.com/macos/)
[![App Store](https://img.shields.io/badge/App%20Store-Available-green)](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20On--Device-brightgreen)](https://puritysb.github.io/ViewLingo/privacy)

## About ViewLingo

Drag a viewfinder over a game, video, photo, PDF or app window. ViewLingo recognizes the text and lays the translation directly over the original, like AR for your screen. No copying, no switching apps, and nothing leaves your Mac.

## Key Features

### Viewfinder Translation
Press `fn + Control + Option` (configurable in Settings) and drag over the text you want to read. Double-tap `fn + Control` to drop a viewfinder right at your pointer. Move or resize it at any time and the translation follows.

### In-Place AR Overlay
Translations are drawn over the original text, fitted to its layout and colors, with automatic font sizing so longer translations stay readable. When space is tight, hover to see the full translation.

### Live Mode
Turn on Live and ViewLingo follows changing text in video subtitles, games, slides and streams, and holds steady when the screen doesn't change. Lock the viewfinder to click and scroll through it while translation keeps running on top.

### Controls That Stay Out of the Way
Live, Retry and Close sit just outside your selection, so they never cover the text you're reading.

### Vertical Text
Vertical Japanese, Chinese and Korean text is recognized and translated.

### Languages From Your Mac
ViewLingo offers every language that both your Mac's text recognition and Apple Translation support, so the list grows with macOS. Setup walks you through downloading each language pack once; after that, translation works offline.

### Private by Design
- **100% on-device**: Apple Vision recognizes the text and Apple Translation translates it, on your Mac
- **Works offline**: No internet connection needed once language packs are downloaded
- **No account, no analytics, no tracking**: Your screen content never leaves your device
- **One permission**: Screen Recording, used only for the area you select
- **Local history**: Translation history stays on your Mac; choose how long to keep it or clear it anytime

## System Requirements

- macOS 15.0 or later
- Universal app for Apple silicon and Intel Macs
- Screen Recording permission

## Get ViewLingo

- **Platform**: [Mac App Store](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12)
- **Pricing**: One-time purchase, no subscription. Check the App Store for pricing in your region.
- **App languages**: English, Korean, Japanese, Simplified and Traditional Chinese, Thai, Vietnamese, German, French, Spanish and Brazilian Portuguese

## See it in use

- [Translate Japanese games on a Mac](https://puritysb.github.io/ViewLingo/translate-japanese-games-on-mac.html): actual recording, language setup, Live mode and practical limits.
- [User guide](https://puritysb.github.io/ViewLingo/guide.html) and [FAQ](https://puritysb.github.io/ViewLingo/faq.html).

Website maintainers: homepages share `css/home.css` and `css/acquisition.css`; navigation and the native language selector use `css/common.css`. Keep the five localized homepage structures aligned. `assets/tokens.css` is generated from the app and must not be edited by hand. Update shared asset version queries when publishing CSS or script changes. The public URL inventory is `sitemap.xml`; publishing it does not confirm search-engine indexing.

Run website regression checks with `node --test tests/*.test.cjs` and `git diff --check`. Inspect desktop and mobile layouts in the browser. The game guide preserves registered incoming campaigns; otherwise its Store links use the fixed `web_game_guide` campaign label. This is aggregate App Store attribution, not app telemetry or a purchase event sent to Google.

## Built With Apple Technologies

- Apple Vision (text recognition)
- Apple Translation (on-device translation)
- ScreenCaptureKit (screen capture)
- SwiftUI and AppKit

## Support

- **Bug Reports**: [Open an issue](https://github.com/puritysb/ViewLingo/issues)
- **Questions and ideas**: [GitHub Discussions](https://github.com/puritysb/ViewLingo/discussions)
- **Website**: [puritysb.github.io/ViewLingo](https://puritysb.github.io/ViewLingo/)

## Documentation

- **[Official Website](https://puritysb.github.io/ViewLingo)** - Product information
- **[User Guide](https://puritysb.github.io/ViewLingo/guide)** - Complete usage guide
- **[FAQ](https://puritysb.github.io/ViewLingo/faq)** - Frequently asked questions
- **[Privacy Policy](https://puritysb.github.io/ViewLingo/privacy)** - Our commitment to your privacy

## License

ViewLingo is proprietary software available exclusively through the [Mac App Store](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12).

---

<p align="center">
  Made with care by <a href="https://github.com/puritysb">Serendipity Bound</a>
</p>
