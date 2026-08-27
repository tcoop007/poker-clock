# Poker Clock ⏱️

A feature-rich countdown timer application designed for poker tournaments and time-management. Run timers sequentially with audio alerts, customize durations, and keep your screen on with native Wake Lock support.

**Live Demo:** https://tcoop007.github.io/poker-clock/

## Features

- ⏱️ **Configurable Timers** – Create unlimited timers with custom names and durations
- 🔄 **Sequential Playback** – Timers automatically progress through the sequence
- 🔊 **Audio Alerts** – Distinctive 3-short + 1-long beep pattern at timer end
- 📱 **Progressive Web App (PWA)** – Install as standalone app on mobile/desktop
- 🔒 **Wake Lock Support** – Screen stays on during countdown (native on Android/Chrome, silent audio fallback for iOS)
- 💾 **Persistent Storage** – All timer configurations saved locally
- 🌙 **Dark Mode** – Automatic light/dark theme based on system preferences
- ⚡ **Offline Support** – Works completely offline with service worker caching
- ⏰ **Secondary Timer** – 30-second bonus timer for quick intervals
- 📊 **Responsive Design** – Optimized for mobile, tablet, and desktop

## Tech Stack

- **React 18** + TypeScript – Type-safe component architecture
- **Vite 8.2.2** – Lightning-fast build tooling
- **Web Audio API** – Programmatic audio generation
- **LocalStorage API** – Persistent timer configuration
- **Service Worker** – Offline caching and PWA support
- **Screen Wake Lock API** – Native screen-on support

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/tcoop007/poker-clock.git
cd poker-clock

# Install dependencies
npm install
```

### Development

```bash
# Start dev server with hot module reload
npm run dev
```

Open [http://localhost:5174/poker-clock/](http://localhost:5174/poker-clock/) (or the port shown in terminal)

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Usage

### Running Timers

1. **Start Timer** – Click the "Start" button to begin the current timer
2. **Pause/Resume** – Use Pause to stop, Start to resume
3. **Skip to Next** – Press `>|` to advance to the next timer in the sequence
4. **Restart Current** – Press `|<` to reset the current timer
5. **Reset All** – Click "Reset" to go back to the first timer

### Configuring Timers

1. Click the **⚙ Settings** button (top-right)
2. Enter a timer name (e.g., "Blind Level 1")
3. Set duration in minutes
4. Click "Add Timer"
5. Use **↑/↓** buttons to reorder timers
6. Use **×** button to delete timers
7. Click "Start Countdown" to return to timer view

### Secondary Timer

- Click the **↻30** button to start a 30-second timer overlay
- Useful for quick breaks or side intervals
- Runs independently alongside the main timer

### Installing as PWA

**Desktop (Chrome/Edge):**
1. Visit https://tcoop007.github.io/poker-clock/
2. Click the **Install** button in the address bar
3. Click "Install"

**Mobile (iOS/Android):**
- **iOS (Safari):** Tap Share → Add to Home Screen
- **Android (Chrome):** Tap the menu (⋮) → Install app

Once installed, the app runs in fullscreen mode with Wake Lock enabled to keep the screen on during countdowns.

## Features in Detail

### Audio Alerts

Each timer plays a distinctive chime pattern:
- 3 short beeps (200ms each)
- 1 long beep (600ms)

Triggered when timer reaches 1 second remaining.

### Wake Lock Support

Prevents screen sleep during countdowns:
- **Chrome/Edge/Android:** Uses native Screen Wake Lock API
- **iOS Safari:** Falls back to silent audio loop technique

Wake Lock is automatically acquired when any timer starts and released when paused.

### Offline Support

Service Worker automatically caches:
- App HTML, CSS, and JavaScript
- Favicon and manifest
- Timer assets

Full functionality available offline, including all UI and timers.

### Dark Mode

Automatically switches based on system settings:
- Light mode: Blue accent (#2f2bf8)
- Dark mode: Inverted scheme

## Project Structure

```
poker-clock/
├── src/
│   ├── App.tsx           # Main timer component & logic
│   ├── App.css           # Styling with CSS variables
│   ├── index.css         # Global styles & theme
│   └── main.tsx          # React entry point
├── public/
│   ├── manifest.json     # PWA metadata
│   └── service-worker.js # Offline caching
├── dist/                 # Production build (generated)
├── index.html            # Root HTML (dev entry point)
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies & scripts
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run code linter
```

## Browser Support

- ✅ Chrome/Edge 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ iOS Safari 11+
- ✅ Android Chrome 60+

## Known Limitations

- iOS Safari: Wake Lock uses silent audio fallback (doesn't support native API)
- Service Worker: Requires HTTPS or localhost (not available on plain HTTP)

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

## Author

[tcoop007](https://github.com/tcoop007)

