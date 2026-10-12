# Chrome Multiroute Audio

A device-agnostic Chrome extension project for routing individual browser tabs to separate audio output endpoints.

Examples include headphones, speakers, USB interfaces, display audio, and virtual audio devices. Available destinations depend on what the operating system, driver, and Chrome expose.

## Project status

The repository contains a small unpacked Manifest V3 feasibility prototype. It is not a qualified release; browser and hardware acceptance results are tracked in [the feasibility report](docs/feasibility-report.md).

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

The prototype has no build step, recording, telemetry, or vendor-specific routing. It intentionally omits the full manager, preferences, gain controls, and robust failure policy planned in the spec.

