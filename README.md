# Chrome Multiroute Audio

A device-agnostic Chrome extension project for routing individual browser tabs to separate audio output endpoints.

Examples include headphones, speakers, USB interfaces, display audio, and virtual audio devices. Available destinations depend on what the operating system, driver, and Chrome expose.

## Project status

Specification only. No extension implementation or installable build exists yet.

Read [the detailed product and engineering specification](SPEC.md) for scope, user flows, browser constraints, permissions, architecture, lifecycle behavior, testing, and delivery milestones.

## Initial release scope

- Multiple tabs routed concurrently, with one destination per tab.
- Independent output selection, volume, and mute.
- Background audio that continues after the popup closes.
- Local processing and local preferences.
- Windows Chrome qualification first, with portable application code.
- Capability-based routing without vendor-specific dependencies.

Arbitrary channel mapping within a device and sending one tab to multiple outputs are later capabilities with separate validation gates.

## First implementation step

Complete the feasibility prototype in SPEC.md, milestone 0. Validate real capture, two separate destinations, device permission handling, and background audio before building the full interface.

