# Rhythm OS

Rhythm OS is an interactive polyrhythm generator that lets you explore multiple rhythmic cycles simultaneously with synchronized audio and visual feedback. Built for musicians, producers, and anyone exploring rhythm complexity.

## Features

- **Polyrhythm Engine** — Layer independent beat counts (e.g., 3 against 4, 5 against 7) with precise synchronization
- **BPM Control** — Adjustable tempo from 40–200 BPM with real-time, drift-free transitions
- **Web Audio API** — Proper lookahead scheduling with distinct tones per layer
- **Circular Visualization** — Orbiting dots with glowing beat indicators, animated via `requestAnimationFrame`
- **Per-Layer Controls** — Mute, add, or remove individual rhythm layers
- **Presets** — Quick-start with 3:2, 4:3, 5:4, and 5:3 polyrhythms
- **Export / Import** — Save and load rhythm configurations as JSON
- **State Persistence** — Automatically saves your current session to `localStorage`
- **Mobile Responsive** — Touch-friendly controls and adaptive layout

## Tech Stack

- **React 19** — Component-based UI
- **Vite 8** — Fast development and optimized production builds
- **Web Audio API** — Lookahead scheduling for precise, drift-free audio
- **`requestAnimationFrame`** — Smooth 60fps visual animation loop
- **CSS Custom Properties** — Dark theme with modern responsive design

## License

MIT