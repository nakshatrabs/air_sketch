# Air Draw Engine — Spatial Creative Canvas Engine

An interactive spatial graphics platform built with Next.js that transforms your camera feed into a real-time digital art board. By leveraging browser-native computer vision models, users can paint on-screen simply by gesturing in front of their webcam.

---

## 🛠 Tech Stack & Dependencies

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (Dark Mode Glassmorphism)
- **Icons:** `lucide-react`
- **Vision Models:** MediaPipe Hands (via WebAssembly CDN)
- **Rendering Pipeline:** HTML5 Canvas API (Dual-Layer Architecture)

---

## 🚀 Key Architectural Features

### 1. Dual-Layer Canvas Engine
To maximize rendering performance and maintain 60 FPS, the rendering engine separates static canvas drawing from variable UI indicators:
*   **Video Layer (Bottom):** Hardware-accelerated camera stream mirrored horizontally (`scale-x-[-1]`) for an intuitive mirror reflection effect.
*   **Drawing Layer (Middle):** An isolated transparent canvas where permanent drawings are committed.
*   **Cursor Overlay Layer (Top):** A dynamic canvas that clears and redraws every frame, rendering the contextual cursor circle around the user's index finger without redrawing the artwork underneath.

### 2. Gesture Vector Logic
The application decodes coordinates from the MediaPipe Hand tracking model graph:
*   **Drawing Mode:** Raised Index Finger (`INDEX_FINGER_TIP.y < INDEX_FINGER_PIP.y`) while the middle finger remains down.
*   **Hover/Navigation Mode:** Raised Index + Middle Finger simultaneously. This instantly interrupts the drawing line vector paths, allowing the user to reposition their hand across the screen without accidental paint strokes.

### 3. Path Interpolation & Smoothing
Raw coordinate points captured frame-by-frame from web cameras can be jittery due to lighting or camera refresh limits. Air Draw implements **Quadratic Bezier Curves** (`ctx.quadraticCurveTo()`) mapping tracking inputs to calculated midpoints. This creates smooth strokes instead of sharp, angular webbed polylines.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
