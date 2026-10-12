# Milestone 0 feasibility report

Status: **No-go pending visible Chrome and hardware validation**. The source tree provides a real Chrome API path, but source review and syntax checks cannot prove endpoint isolation, permission behavior, or background playback.

## Implemented path

- Toolbar popup freezes the current source tab when opened and starts capture only after **Route this tab** is clicked.
- Service worker obtains a short-lived tab stream ID after popup invocation and passes it to one offscreen document.
- Offscreen engine creates one `AudioContext` per route, sets a selected sink when requested, consumes the tab stream, and renders through a gain node. Captures are independent in memory.
- The popup can be closed while the offscreen document owns streams. Reopening it asks the engine for current routes, so service worker globals are not the live status source.
- Visible setup page enumerates outputs, detects `selectAudioOutput()`, and offers an explicit temporary microphone-permission path. Temporary microphone tracks are stopped immediately.
- Local fixture pages generate distinct deterministic 220 Hz and 440 Hz tones.

## Evidence status

| Claim | Status | Evidence or missing check |
| --- | --- | --- |
| Manifest and scripts parse | Verified locally | JSON parse and JavaScript syntax checks. |
| Concurrent start and stop ordering | Verified locally | `node --test tests/start-race.test.js` forces overlapping starts in both worker and engine, checks that explicit stop sends no early idle signal, and holds context closure open while two stops race. Starting the same tab during cleanup is rejected without a second capture. This does not prove browser behavior. |
| Chrome loads unpacked extension | Untested | Requires visible Chrome extension load. |
| One tab captures and renders to fixed output | Untested | Requires Chrome/hardware observation. |
| Two tabs route to distinct endpoints without crossfeed | Untested | Requires separate endpoint meters or loopback capture. |
| Popup closure preserves both routes | Untested | Requires live browser run. |
| Worker truly suspends while audio continues | Untested | Requires observed worker termination and output monitoring. |
| Five-minute source silence preserves capture | Untested | Requires timed live run. |
| Offscreen `AudioContext.resume()` succeeds from toolbar invocation | Untested | Requires live run and exact error capture if denied. |
| Setup-page output permission carries to offscreen engine | Untested | Requires selection/grant followed by offscreen use. |
| No-microphone system can route to default and discover outputs | Untested | Requires qualifying machine or disabled-input setup. |
| Fixed-output loss remains silent and recoverable | Not implemented | Prototype records Chrome behavior; production policy belongs to later reliability work. |

No Chrome version, OS/device combination, physical output path, or driver behavior is claimed as qualified by this report yet. A Windows device inventory can identify candidate endpoints but does not establish their visibility or use in Chrome.

## Recommendation

Keep milestone 0 open until the [manual validation plan](feasibility-manual.md) passes on a visible Windows Chrome machine. The core architecture remains plausible, but an implementation decision should depend on measured output isolation and permission propagation. If either fails, investigate an alternative permission or rendering path before building the full UI.

## Prototype limits

This proof of concept lacks production message schema/revisions, route operation cancellation, persistence, device-loss monitoring, volume/mute controls, and accessibility qualification. Endpoint labels are browser-provided and can be blank; names do not imply channel mapping. Stopping a route ends capture and should return the tab to native playback, subject to browser validation.
