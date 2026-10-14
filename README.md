# Chrome Multiroute Audio

A device-agnostic Chrome extension project for routing individual browser tabs to separate audio output endpoints.

Examples include headphones, speakers, USB interfaces, display audio, and virtual audio devices. Available destinations depend on what the operating system, driver, and Chrome expose.

## Project status

The repository contains a small unpacked Manifest V3 feasibility prototype. It is not a qualified release; browser and hardware acceptance results are tracked in [the feasibility report](docs/feasibility-report.md).

For public-release preparation, see the [accessibility and store-readiness checklist](docs/public-release-readiness.md) and [privacy policy](PRIVACY.md).

Read [the detailed product and engineering specification](SPEC.md) for scope, user flows, browser constraints, permissions, architecture, lifecycle behavior, testing, and delivery milestones.

## Initial release scope

- Multiple tabs routed concurrently, with one destination per tab.
- Independent output selection, volume, and mute.
- Background audio that continues after the popup closes.
- Local processing and local preferences.
- Windows Chrome qualification first, with portable application code.
- Capability-based routing without vendor-specific dependencies.

Arbitrary channel mapping within a device and sending one tab to multiple outputs are later capabilities with separate validation gates.

## Try the feasibility prototype

Load this directory with Chrome's **Load unpacked** button on `chrome://extensions`. Serve the repository root with `python -m http.server 8765`, then open `http://localhost:8765/fixtures/tone.html?hz=220` and `http://localhost:8765/fixtures/tone.html?hz=440` in separate tabs. Start each tone with its page button and use the extension toolbar popup on each tab to assign its output. See [the manual validation plan](docs/feasibility-manual.md) for exact steps and evidence to record.

The raw source directory still loads without a build step. The prototype has no recording, telemetry, or vendor-specific routing. It intentionally omits the full manager, preferences, gain controls, and robust failure policy planned in the spec.

## Work on the UI without audio hardware

Install dependencies with `npm install`, then run `npm run dev` and open `http://127.0.0.1:5173/`. The page links to the toolbar popup and device-access screen. This Vite preview supplies sample tabs, routes, and outputs; route controls update sample data only. It never captures audio or requests actual microphone access. Add `?tab=102` to the popup URL to preview a tab that already has a route.

The popup and setup pages are in `src/`. Their existing styles are in `src/ui.css`; `src/app.css` imports Tailwind CSS and those styles for the Vite preview and build. You can use Tailwind utility classes in the HTML while developing. Run `npm run build` to generate a Tailwind-styled unpacked extension in `dist/`, then use Chrome's **Load unpacked** on `dist/` to test the built UI with real extension APIs. The development mock is not included in that build. Run `npm test` for the existing logic checks.

