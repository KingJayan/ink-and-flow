# Ink & Flow

**Write without trouble**

Ink & Flow is a tactile, distraction-free writing environment that blends the tactile joy of writing with the boundless potential of modern AI. Designed for writers and thinkers who value focus and fluidity

---

## Features

### Intelligence
- **Ghost Writer**: context-aware AI suggestions that help you find the next word without breaking your flow
- **Tone Analyzer**: real-time analysis of your writing style, measuring formality, emotion, clarity, and creativity
- **"Continue From Here"**: bridge ideas seamlessly with AI that understands what came before and what follows your cursor
- **Contextual Awareness**: the AI understands your entire document, not just the current line

### The Editor
- **Distraction-Free Canvas**: a minimal, beautiful writing surface optimized for long-form thought
- **Typewriter Mode**: keep your active line centered vertically, just like a classic typewriter
- **Focus Mode**: fade away the UI and immerse yourself entirely in the page
- **Universal Search (cmd+K)**: instantly find any document or content across your entire library
- **Internal Linking**: mention other documents using `@` to create a personal wiki of ideas

### Productivity
- **Pomodoro Timer**: integrated, customizable timer (1-120 min) to help you maintain deep focus
- **Version History**: save snapshots of your work and restore previous versions with ease
- **Cloud Sync**: powered by Firebase for real-time saving and multi-device access
- **Dark Mode**: a meticulously crafted dark theme for late-night inspiration

---

## Quick Start

### prereqs
- Node.js (v18+)
- npm or yarn
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- A Firebase project (for cloud features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ink-and-flow.git
   cd ink-and-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure env variables**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_id
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

---

## Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘ + K` | Open Search Palette |
| `⌘ + J` | Trigger Ghost Writer |
| `⌘ + Shift + J` | AI "Continue From Here" |
| `Tab` | Accept AI Suggestion |
| `@` | Link another document |

---

## Built With

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Editor Core**: [Tiptap](https://tiptap.dev/) (ProseMirror)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Database/Auth**: [Firebase](https://firebase.google.com/)
- **State Management**: [Nano Stores](https://github.com/nanostores/nanostores)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with :) by jayan</p>
</div>
