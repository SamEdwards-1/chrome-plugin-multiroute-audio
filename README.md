# Chrome Multiroute Audio

A device-agnostic Chrome extension project for routing individual browser tabs to separate audio output endpoints.

Examples include headphones, speakers, USB interfaces, display audio, and virtual audio devices. Available destinations depend on what the operating system, driver, and Chrome expose.

## Project status

Version 0.1.0 is being prepared for its first public Chrome Web Store submission. It has not been published. On October 17, 2026, the developer reported successful independent testing. Earlier browser and hardware observations are tracked in [the feasibility report](docs/feasibility-report.md); this is not a broad hardware compatibility or accessibility certification.

For submission copy, permission justifications, assets and current launch status, see [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md). See also the [accessibility and store-readiness checklist](docs/public-release-readiness.md) and [privacy policy](PRIVACY.md).

Read [the detailed product and engineering specification](SPEC.md) for scope, user flows, browser constraints, permissions, architecture, lifecycle behavior, testing, and delivery milestones.

## Features in 0.1.0

- Multiple tabs routed concurrently, with one destination per tab.
- Independent output selection and switching.
- Focus a routed tab or stop its route from the popup.
- Background audio that continues after the popup closes.
- Local processing without recording, analytics, accounts, or saved routing preferences.
- Tested by the developer in Chrome on Windows; other configurations remain unverified.
- Capability-based routing without vendor-specific dependencies.

Volume and mute controls, saved preferences, arbitrary channel mapping within a device, and sending one tab to multiple outputs are not included.

## Try the extension

Load this directory with Chrome's **Load unpacked** button on `chrome://extensions`. Serve the repository root with `python -m http.server 8765`, then open `http://localhost:8765/fixtures/tone.html?hz=220` and `http://localhost:8765/fixtures/tone.html?hz=440` in separate tabs. Start each tone with its page button and use the extension toolbar popup on each tab to assign its output. See [the manual validation plan](docs/feasibility-manual.md) for exact steps and evidence to record.

The raw source directory still loads without a build step. For the Store submission, use the production build and package described below.

## Build the Store package

Run `npm ci`, `npm test`, then `powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1` from this directory. The packaging script builds the production extension, validates its assets and permissions, and writes `release/multiroute-audio-0.1.0.zip` with `manifest.json` at the ZIP root. It refuses to overwrite an existing package. Build output excludes the development mock, fixtures, tests, documentation and Store graphics.

Load `dist/` unpacked for the final installed-build check before uploading the ZIP. Chrome assigns a new extension ID for the Store item; routes and device permissions from the development ID do not migrate. See [the submission document](CHROMEWEBSTORE.md) for the remaining account, image and dashboard steps.

## Work on the UI without audio hardware

Install dependencies with `npm install`, then run `npm run dev` and open `http://127.0.0.1:5173/`. The page links to the toolbar popup and device-access screen. This Vite preview supplies sample tabs, routes, and outputs; route controls update sample data only. It never captures audio or requests actual microphone access. Add `?tab=102` to the popup URL to preview a tab that already has a route.

The popup and setup pages are in `src/`. Their existing styles are in `src/ui.css`; `src/app.css` imports Tailwind CSS and those styles for the Vite preview and build. You can use Tailwind utility classes in the HTML while developing. Run `npm run build` to generate a Tailwind-styled unpacked extension in `dist/`, then use Chrome's **Load unpacked** on `dist/` to test the built UI with real extension APIs. The development mock is not included in that build. Run `npm test` for the existing logic checks.

