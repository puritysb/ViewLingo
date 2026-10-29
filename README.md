# ViewLingo - AR Screen Translator for Mac

Read any text on your Mac screen in your language, right where it appears.

🌍 Language: **English** | [한국어](docs/README-ko.md) | [日本語](docs/README-ja.md) | [简体中文](docs/README-zh-Hans.md) | [繁體中文](docs/README-zh-Hant.md) | [ไทย](docs/README-th.md) | [Español](docs/README-es.md) | [Français](docs/README-fr.md) | [Deutsch](docs/README-de.md) | [Tiếng Việt](docs/README-vi.md)

[![macOS](https://img.shields.io/badge/macOS-15.0+-blue)](https://www.apple.com/macos/)
[![App Store](https://img.shields.io/badge/App%20Store-Available-green)](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12)
[![Privacy](https://img.shields.io/badge/Privacy-Local%20by%20default-brightgreen)](https://puritysb.github.io/ViewLingo/privacy.html)

## About ViewLingo

Drag a viewfinder over a game, video, photo, PDF or app window. ViewLingo recognizes the text and lays the translation directly over the original, like AR for your screen. No copying or switching apps. Regular capture and Live translation use Apple on your Mac.

## Key Features

### Viewfinder Translation
Press `fn + Control + Option` (configurable in Settings) and drag over the text you want to read. Double-tap `fn + Control` to drop a viewfinder right at your pointer. Move or resize it at any time and the translation follows.

### In-Place AR Overlay
Translations are drawn over the original text, fitted to its layout and colors, with automatic font sizing so longer translations stay readable. When space is tight, hover to see the full translation.

### Live Mode
Turn on Live and ViewLingo follows changing text in video subtitles, games, slides and streams, and holds steady when the screen doesn't change. Lock the viewfinder to click and scroll through it while translation keeps running on top.

### Compact Viewfinder Controls
Compact viewfinder controls keep Live, Retry and Close within reach. In 3.0, full-screen selections use an inset toolbar with room for edge resizing.

### Vertical Text
Vertical Japanese, Chinese and Korean text is recognized and translated.

### Languages From Your Mac
ViewLingo offers every language that both your Mac's text recognition and Apple Translation support, so the list grows with macOS. Setup walks you through downloading each language pack once; after that, default Apple translation works offline.

### Private by Design
- **Apple by default**: Text recognition, regular capture translation and Live run on your Mac
- **Default translation works offline**: Apple needs no internet connection after language packs are downloaded
- **No app analytics or tracking**: Default Apple translation requires no account
- **One permission**: Screen Recording, used only for the area you select
- **Local history**: History and screenshots are stored on your Mac; choose how long to keep them or clear them anytime

### Optional DeepL comparison in 3.0
ViewLingo 2.x remains local. When 3.0 is available, you can save your own DeepL API key in macOS Keychain, consent to sharing text and explicitly request a separate comparison. Only the selected original, up to five previous passages from the same capture and five selected glossary terms are sent. Screenshots, window titles and the full history are never sent. Opening settings or editing a glossary does not send text. Provider data terms, fees and limits apply separately from ViewLingo; do not send personal or confidential text with Free / Developer. See the [Privacy Policy](https://puritysb.github.io/ViewLingo/privacy.html) before enabling it.

## System Requirements

- macOS 15.0 or later
- Universal app for Apple silicon and Intel Macs
- Screen Recording permission

## Get ViewLingo

- **Platform**: [Mac App Store](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12)
- **Pricing**: One-time app purchase, no ViewLingo subscription. Check the App Store for regional pricing; optional DeepL API usage is separate.
- **App languages**: English, Korean, Japanese, Simplified and Traditional Chinese, Thai, Vietnamese, German, French, Spanish, Brazilian Portuguese and Russian

## See it in use

- [Translate Japanese games on a Mac](https://puritysb.github.io/ViewLingo/translate-japanese-games-on-mac.html): actual recording, language setup, Live mode and practical limits.
- [User guide](https://puritysb.github.io/ViewLingo/guide.html) and [FAQ](https://puritysb.github.io/ViewLingo/faq.html).

Website maintainers: homepages share `css/home.css` and `css/acquisition.css`; navigation and the native language selector use `css/common.css`. Keep the five localized homepage structures aligned. `assets/tokens.css` is generated from the app and must not be edited by hand. Update shared asset version queries when publishing CSS or script changes. The public URL inventory is `sitemap.xml`; publishing it does not confirm search-engine indexing.

Image thumbnails use a native dialog from `js/media.js`: Close, Escape and the backdrop return to the same page and restore focus. Media playback is exclusive, including the dynamically created hero video. FAQ answers use native disclosures; the interactive illustration has a keyboard-accessible example button and is explicitly not a performance benchmark.

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
- **[Privacy Policy](https://puritysb.github.io/ViewLingo/privacy.html)** - Our commitment to your privacy

## License

ViewLingo is proprietary software available exclusively through the [Mac App Store](https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=github&mt=12).

---

<p align="center">
  Made with care by <a href="https://github.com/puritysb">Serendipity Bound</a>
</p>
