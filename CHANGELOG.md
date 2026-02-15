# ViewLingo Changelog

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
