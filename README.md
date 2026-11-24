# Interval ear

A small practice room for hearing intervals. The app plays a root and shows its name, for example **C**. It then plays a second note. You find that note on the keyboard. A fifth above C is **G**.

The drill starts with fourths and fifths, going up. Settings can switch to seconds, easy intervals, wider leaps, or every interval from a minor second through the octave, and the second note can sit above the root, below it, or either way.

## Run it locally

```bash
npm install
npm run dev
```

Open the local address Vite prints. The dev server uses the same `/interval-ear/` base path as GitHub Pages.

```bash
npm test
npm run typecheck
npm run build
```

## GitHub Pages

This app is meant to live next to the other projects, as [petternordholm/interval-ear](https://github.com/petternordholm/interval-ear). The site is then [petternordholm.github.io/interval-ear](https://petternordholm.github.io/interval-ear/).

1. Create a public repository named `interval-ear` and push this project to `main`.
2. In the repository, open **Settings → Pages → Build and deployment**, and choose **GitHub Actions**.
3. The workflow in `.github/workflows/ci.yml` builds the site and deploys `dist` on every push to `main`.

The Vite `base` is `/interval-ear/`. If the repository name changes, update `base` in `vite.config.ts` to match.

Sound is generated in the browser with the Web Audio API. Nothing is uploaded, and the score stays in local storage on this device.
