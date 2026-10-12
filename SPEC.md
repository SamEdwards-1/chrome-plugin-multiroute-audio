# Multiroute Audio Extension Specification

Status: Draft for implementation  
Version: 0.1  
Date: 2026-10-07  
Repository: chrome-plugin-multiroute-audio

## 1 Purpose

Build a device-agnostic desktop Chrome extension that sends audio from individual browser tabs to user-selected audio output endpoints. A user can keep several tabs playing simultaneously, send each to a different destination, and control their levels independently.

Examples include a video tab routed to headphones, a music tab routed to speakers, and a browser instrument routed to a virtual audio cable or an interface playback endpoint. The same interface hardware may expose several separately selectable endpoints, depending on its operating system and driver.

The first release provides one destination per routed tab, with multiple routes active together. Sending one tab to several destinations and assigning audio to arbitrary channels within a multichannel endpoint are later features with separate feasibility gates.

This is a product and engineering specification. Requirements and numerical targets describe intended behavior, not capabilities already implemented or measured.

## 2 Principles and terminology

The product must work through browser-exposed capabilities. No device vendor, model name, driver naming convention, or hardware mixer is part of the routing algorithm.

| Term | Meaning |
| --- | --- |
| Tab source | The combined audio Chrome captures from one browser tab. |
| Output endpoint | An audio output entry that Chrome enumerates and permits the extension to use. |
| Physical device | Hardware such as speakers, a headset, a monitor, or an audio interface. It may expose one or several endpoints. |
| Channel | One audio signal within an endpoint, such as left or right. A channel is not itself necessarily a selectable endpoint. |
| Route | One captured tab connected to one selected endpoint, with its own gain, mute state, and lifecycle. |
| System default | A logical destination that follows the operating system's default output behavior. |
| Fixed output | A specific selected endpoint, independent of the current system default. |
| Native playback | Playback performed by Chrome without an active extension capture route. |

Endpoint labels are presentation data. The extension must never infer a channel map from names such as “3/4,” “Headphones,” or “USB.”

## 3 Scope and platform support

### First release

- Manifest V3 desktop Chrome extension, with local audio processing.
- Windows is the first release qualification platform.
- Keep application code portable to desktop Chrome on macOS and Linux; advertise support for those platforms only after the same acceptance suite passes.
- Use Chrome 116 as the initial API floor, with runtime capability detection. Before release, publish the actual tested Chrome versions and raise the minimum if validation requires it.
- Support stereo and mono sources through the browser's normal output conversion.
- Qualify four simultaneous stereo routes first; use an initial product limit of eight active routes, subject to stress testing.
- Support multiple tabs routed to the same endpoint as well as different endpoints.
- Provide volume, mute, endpoint switching, route status, remembered destination suggestions, and cleanup.
- Work with built-in outputs, USB audio devices, HDMI/DisplayPort outputs, Bluetooth devices, virtual audio endpoints, and separately exposed interface endpoints when permitted by Chrome.

### Deferred capabilities

- Mirroring one tab to several endpoints.
- Explicit channel-pair placement inside a multichannel endpoint.
- Named routing scenes and import/export.
- Per-site destination rules beyond remembering a recent choice.
- Optional keyboard commands and a persistent side panel.
- Qualification for other Chromium browsers.

### Outside the first release

- ASIO access, exclusive-mode driver control, hardware sample-rate changes, or vendor mixer control.
- Installing drivers or creating virtual audio devices.
- System-wide application routing, microphone mixing, recording, transcription, or network streaming.
- Routing individual players or calls separately when they share one tab.
- Sample-accurate synchronization across independent devices.
- Mobile browsers, Firefox, Safari, and incognito mode.
- Guaranteed capture of protected media or browser-restricted pages.

## 4 Browser capability boundary

Chrome offers user-initiated tab capture. Capturing suppresses that tab's normal local playback, so the extension must render the captured audio to make it audible. Capture can continue across navigation; an ended capture requires a fresh valid start operation. Stream identifiers are short-lived and single-use. [Tab capture reference](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)

Chrome supports selecting a permitted audio output with AudioContext.setSinkId(). Endpoint discovery and permission determine what the user can select. [Chrome output selection](https://developer.chrome.com/blog/audiocontext-setsinkid)

These APIs make endpoint routing plausible. They do not establish that every physical device exposes every hardware channel as a separate endpoint. If a driver exposes only one stereo destination, version one presents one stereo destination.

The implementation must prove simultaneous capture, permission flow, background rendering, and device switching in a short technical prototype before committing to the full UI.

## 5 User journeys

### Route the current tab

1. The user opens the toolbar popup while viewing the tab they want to route.
2. The popup shows that tab, currently available outputs, and a Route audio button.
3. If output discovery is restricted, the popup offers Enable audio device access and opens a visible extension setup page.
4. After setup, the user returns to the source tab and reopens the popup.
5. The user selects an endpoint and starts the route.
6. The route shows Starting until the audio engine acknowledges a valid running graph and selected sink.
7. The row then shows Routed, its destination, volume, mute, and Stop routing.
8. Closing the popup leaves the route running.

Only an explicit start initiates capture. Opening the popup, opening the manager, or restoring saved settings must not start audio capture.

### Route additional tabs

The user visits another source tab and repeats the toolbar flow. Existing routes continue playing. The manager lists all active routes and allows changes to their destinations and levels.

A manager button for an unrouted tab may focus that tab and instruct the user to invoke the toolbar action. It must not imply that selecting any arbitrary tab grants capture permission. Chrome's activeTab access is tied to recognized user invocation, and temporary access can expire on navigation. [activeTab documentation](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

### Use interface or virtual mixer endpoints

The user selects the endpoint by its browser-provided name. Routing inside an external hardware or software mixer remains under that mixer's control. Setup help explains that an endpoint can exist without a physically attached speaker and that signal activity does not prove audibility.

### Stop routing

Stop routing releases capture and returns the tab to native playback. The UI labels this consequence: “Stop routing — return to normal output.” Mute keeps the capture active and silences only the extension's route.

Stop all routing applies the same behavior to every route. It is not an emergency silence control; Mute all is a separate action.

## 6 Interface requirements

### Toolbar popup

- Show the current tab title when accessible, otherwise a neutral tab identifier.
- Include output selection, Route audio or Stop routing, volume, and mute.
- Show the actual route state rather than an optimistic “connected” indication.
- Provide links to Manage routes, Audio devices, and Help.
- Show an active-route count and attention state on the toolbar badge.
- Explain unsupported pages and unavailable permissions in plain language.

### Route manager

Use a full extension page for the first release so users can manage multiple routes without keeping a popup open. Each route row contains:

| Field or action | Required behavior |
| --- | --- |
| Source | Accessible title or user alias; clicking focuses its tab. |
| Destination | User alias plus original device label where helpful. |
| State | Starting, Routed, Muted, Switching, Output unavailable, Needs attention, or Stopping. |
| Level | 0–100 percent; the source's own volume still applies. |
| Mute | Silence the route while retaining the selected destination and capture. |
| Signal meter | Optional visual activity indicator; never label it as proof of physical output. |
| Stop routing | Release capture and return to native output. |
| Error action | Retry, Choose another output, or Return to normal output as appropriate. |

The manager supports Mute all and Stop all routing. Muting all is an independent master mute flag; clearing it restores each route's earlier individual mute state.

No remote favicons or page assets should be fetched solely for this UI. Use local icons or browser-provided metadata when available and permitted.

### Device setup page

- List discovered output endpoints and the special System default choice.
- Offer Refresh and an explicit device-access action.
- Allow local display aliases without changing operating system names.
- Distinguish missing devices from devices awaiting permission.
- Explain that channel pairs appear separately only when the driver exposes them that way.
- Offer an optional short test tone for the selected endpoint, requiring a user click.
- Default test tone to approximately -30 dBFS, fade its edges, cap duration at one second, and provide immediate stop.

### Accessibility

All controls must support keyboard operation, visible focus, accessible labels, and screen-reader state announcements. Status must not depend only on color. Respect reduced motion, support 200 percent zoom without losing controls, and avoid announcing rapidly changing meter values.

## 7 Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | Start capture only for the explicitly selected, eligible source tab after user invocation. | Required |
| FR-02 | Route each source to exactly one destination in version one. | Required |
| FR-03 | Keep routes independent when other routes start, switch, fail, mute, or stop. | Required |
| FR-04 | Continue rendering after popup or manager closure. | Required |
| FR-05 | Change a route's output without intentionally restarting its source media. | Required |
| FR-06 | Provide gain from 0 to 1 and independent mute; never boost above unity. | Required |
| FR-07 | Distinguish logical default from a fixed endpoint. | Required |
| FR-08 | Reconcile endpoint changes and surface actionable route errors. | Required |
| FR-09 | Persist preferences locally while requiring fresh capture after browser restart. | Required |
| FR-10 | Release streams, contexts, listeners, and route records after stop or tab closure. | Required |
| FR-11 | Remain functional across service-worker suspension and restart. | Required |
| FR-12 | Provide a local diagnostic summary with explicit export. | Required |
| FR-13 | Show signal activity while the manager is visible. | Desired |
| FR-14 | Remember a destination suggestion per explicitly opted-in site origin. | Desired |

Where source audio has more than two channels, version one uses an explicitly tested stereo downmix and documents the result. It must not silently claim multichannel preservation.

## 8 Permissions and privacy

Proposed manifest permissions:

| Permission | Purpose |
| --- | --- |
| tabCapture | Capture audio from the user-selected tab. |
| activeTab | Temporary access following toolbar invocation. |
| offscreen | Host the audio engine independently of the popup. |
| storage | Save local preferences and recoverable session metadata. |

Do not initially request broad host permissions, scripting, desktopCapture, webRequest, nativeMessaging, or tabs. Tab lifecycle APIs and basic tab identity can be used without requesting access to every tab's sensitive metadata; titles and URLs must be treated as unavailable when permission is absent. [Tabs API permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs)

The manifest's extension permissions and Web API media permissions are separate. Do not invent a “speaker-selection” manifest permission.

For device access:

1. Enumerate available outputs without opening any microphone.
2. Feature-detect a dedicated output picker such as selectAudioOutput(); use it only where supported and validated in extension pages.
3. Where Chrome requires microphone access to reveal additional outputs, explain this before prompting.
4. Request that access only from the visible setup page after an explicit click.
5. Immediately stop every temporary microphone track. Never connect it to the routing graph, store audio, or transmit audio.
6. On refusal, keep usable default routing available and show the limitation.

The dedicated output picker is a capability to detect, not a baseline assumption. Device permissions and identifiers can change, and previously stored IDs may require renewed authorization. [Audio Output Devices specification](https://w3c.github.io/mediacapture-output/)

Audio stays in memory on the local machine. The first release has no accounts, telemetry, cloud services, remote code, advertising, or audio recording. Store preferences in local storage, not sync storage. Do not persist full browsing history, query strings, page content, or tab audio.

Incognito access is disabled in the initial manifest. Any future incognito support requires isolated sessions and no persistence of private source metadata.

Before distribution, document actual data handling in a privacy policy and verify the store listing against current Chrome Web Store requirements. [User data policy guidance](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

## 9 Architecture

    Toolbar popup and route manager
                 |
        Validated runtime messages
                 |
       Manifest V3 service worker
       - source eligibility
       - capture authorization
       - offscreen lifecycle
       - preferences and status
                 |
        Commands and acknowledgements
                 |
        One offscreen audio engine
       - capture streams
       - route audio contexts
       - device discovery
       - output selection
       - audio graph cleanup
                 |
       Browser audio output endpoints
                 |
          Operating system and drivers

The service worker coordinates operations but owns no live audio graph. Service workers can terminate when idle and lose their globals, so durable settings and live graph ownership must be separated. [Service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

The offscreen document owns all live streams and AudioContexts. Chrome supports only one offscreen document per extension per profile, and its extension API access is limited to runtime messaging. Storage and tab operations therefore go through the service worker. [Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)

Use USER_MEDIA for the capture-stream use case, following Chrome's capture example. Evaluate any additional reason against its documented lifetime behavior; AUDIO_PLAYBACK alone has a silence timeout. Never keep a document alive by emitting synthetic noise. Close the document when it has no routes and no pending work. [Background capture example](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture)

### Audio graph

Start with one AudioContext per route for independent sink selection and failure isolation:

    Captured tab MediaStream
        -> MediaStreamAudioSourceNode
        -> GainNode
        -> optional AnalyserNode
        -> AudioContext destination with selected sink

Use a short gain ramp for changes, initially 10–20 milliseconds. Effective gain is zero if either route mute or master mute is active; otherwise it is the route's saved volume. Do not apply EQ, compression, loudness normalization, or other processing.

Use the context's negotiated sample rate. Treat low-latency settings as hints and expose measured or browser-reported diagnostics without claiming a fixed end-to-end latency. Leave resampling and device mixing to the browser and operating system.

If several routes reach the same endpoint, their combined output may overload the downstream mix even though each route is at or below unity. The UI must allow attenuation and must not claim that a per-route meter detects downstream clipping.

A shared context per endpoint may be considered later if profiling shows a material benefit. It must preserve route isolation and switching semantics.

## 10 Starting and changing routes

### Start transaction

1. The popup captures the current source tab identity when opened; changing focus must not silently change that identity.
2. On Route audio, the worker revalidates the tab, eligibility, authorization, and destination.
3. Reject duplicate starts or return the existing route idempotently.
4. Serialize creation of the offscreen document and wait for engine readiness.
5. Prepare a muted AudioContext and validate the selected sink before requesting capture where feasible.
6. Obtain a fresh capture stream ID in the worker and consume it promptly in the offscreen document; never persist it.
7. Request audio only, create the graph with zero gain, verify the stream has a live audio track, and resume the context.
8. Confirm the requested sink and a running context, then ramp to the intended gain.
9. Acknowledge success with the route's actual state and revision.
10. If any step fails, stop acquired tracks, close the context, and report the failure. Initial setup failure releases capture so native playback can resume.

Opening a popup with default_popup uses a message-driven start handler; do not also rely on action.onClicked firing for that popup. Validate the complete gesture and messaging flow in the prototype.

A user-approved capture may continue during ordinary navigation. If metadata permission disappears, use a neutral source label. If Chrome ends capture, require a new authorized start rather than replaying an old stream ID.

### Output switch

- Serialize operations for that route.
- Record the prior endpoint and intended gain.
- Ramp gain to zero before changing the sink.
- Await sink selection and context readiness.
- On success, commit the new endpoint and restore intended gain.
- On failure, attempt rollback only to the known previous available endpoint.
- If rollback fails, retain a silent capture route with an Output unavailable state.
- Never fall back from a fixed output to System default automatically.
- Acknowledge the outcome; the UI must show the old destination, new destination, or failure accurately.

No seamless or gapless switch is promised. Other routes must remain uninterrupted.

### Stop transaction

Fade out, disconnect the graph, stop every captured track, close its context, remove listeners, and remove the live route. A stop command is idempotent. Cleanup must also run when the source tab closes or a media track ends.

## 11 Lifecycle and failure behavior

| Event | Required response |
| --- | --- |
| Popup closes | Continue routing. |
| Manager closes | Continue routing; stop UI meter polling. |
| Source is silent or paused | Retain the route without fake keepalive audio. |
| Tab is closed | Clean up its route automatically. |
| Source track ends | Clean up and show a stopped/error result when UI next opens. |
| Worker restarts | Query the engine, reconcile captures, and rebuild a status snapshot. |
| Browser restarts or extension reloads | Mark former routes inactive; retain preferences only; require explicit starts. |
| Fixed output disappears | Silence the affected route as soon as detected; show unavailable; require Retry or a new selection. |
| Fixed output reappears | Offer Retry; do not automatically restore audible output. |
| System default changes | Follow the logical default as supported by Chrome; refresh displayed information. |
| Audio permission is revoked | Mute or stop the affected route as necessary and offer the setup page. |
| AudioContext suspends | Show interrupted/needs attention; attempt recovery only under allowed autoplay rules. |
| Machine sleeps and wakes | Re-enumerate, reconcile tracks and contexts, keep unresolved routes silent. |
| Engine disappears | Treat live status as unknown until reconciled; do not recreate captures silently. |
| Another capture conflicts | Report the conflict and offer retry; never stop another extension's capture. |

Monitor devicechange, track ended, context state changes, and supported sink change events. Refresh devices when UI opens and before start, switch, or retry. During active routing, use a low-frequency fallback check only if testing demonstrates missed notifications.

Best-effort silence on output loss is an application policy, not a physical-output guarantee. OS or browser failover can precede notification; engine crashes or extension disablement can restore native playback. Validate and document actual behavior for each supported platform. Do not market the extension as a guaranteed privacy mute or hardware safety control.

The extension must not use the tab's browser mute flag as its gain control. Existing browser or site mute may affect source audio; show relevant guidance without overriding the user's settings. Test this interaction explicitly.

## 12 State and data model

The audio engine is authoritative for live routing. Session storage holds a recoverable metadata snapshot, never proof that audio is running. Local storage holds versioned preferences. [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)

Suggested TypeScript shapes:

    type OutputSelection =
      | { kind: "default" }
      | { kind: "device"; deviceId: string; labelHint?: string };

    type RouteStatus =
      | "starting" | "routed" | "muted" | "switching"
      | "output-unavailable" | "needs-attention" | "stopping";

    interface RouteSnapshot {
      routeId: string;
      sessionId: string;
      tabId: number;
      sourceLabel?: string;
      output: OutputSelection;
      volume: number;          // finite number from 0 through 1
      muted: boolean;
      status: RouteStatus;
      revision: number;
      lastError?: { code: string; message: string };
    }

    interface Preferences {
      schemaVersion: 1;
      preferredOutput?: OutputSelection;
      deviceAliases: Record<string, string>;
      rememberedOrigins: Record<string, OutputSelection>;
      showMeters: boolean;
    }

- Device IDs are opaque, scoped browser values. Never parse them or assume they survive resets.
- Resolve a saved fixed device by exact current ID and permission; a label match is a suggestion requiring user selection.
- Duplicate labels must remain distinguishable in the current session without exposing raw device IDs.
- Store a remembered site origin only after explicit opt-in; do not store complete URLs.
- Never reuse a persisted tab ID across browser sessions.
- Store master mute in session state; it starts false in a new browser session because no captures are restored.
- Provide Clear saved preferences and reject malformed or future-incompatible stored schemas safely.
- Keep route error history bounded and in memory unless the user explicitly exports diagnostics.

## 13 Messaging and concurrency

Every command carries a protocol version, request ID, target component, command type, and validated payload. Replies contain the request ID, success or structured error, and a current snapshot/revision where relevant.

Commands include START_ROUTE, SET_OUTPUT, SET_VOLUME, SET_MUTE, SET_MASTER_MUTE, STOP_ROUTE, STOP_ALL, LIST_OUTPUTS, GET_SNAPSHOT, and RETRY_OUTPUT.

- Accept commands only from this extension's expected pages or worker.
- Define no externally_connectable entry or page content-script bridge.
- Validate route ownership, tab IDs, gain range, endpoint selection, and payload size.
- Serialize mutations per route and serialize offscreen creation globally.
- Coalesce rapid volume updates to the latest requested value.
- Give Stop precedence over pending switches using a cancellation generation.
- Reject stale revisions when they could overwrite newer user intent.
- Make repeated requests idempotent through a bounded request-result cache.
- Time out UI requests, initially after 10 seconds, then query state before retrying.
- A UI timeout must not create a second capture or leak a late-created context.
- Rate-limit meter updates, initially to 10 per second only for visible subscribers.
- Avoid sending audio samples through extension messages.

## 14 Error model and user messages

| Code | User-facing meaning | Recovery |
| --- | --- | --- |
| UNSUPPORTED_SOURCE | This page cannot be routed. | Open a supported source tab. |
| CAPTURE_AUTH_REQUIRED | Open this tab and start routing from the toolbar. | Fresh user invocation. |
| CAPTURE_CONFLICT | This tab is already being captured. | Resolve the other capture and retry. |
| OUTPUT_PERMISSION_REQUIRED | Allow audio device access to select this output. | Open setup page. |
| OUTPUT_MISSING | The selected output is unavailable. | Reconnect and retry, or choose another. |
| OUTPUT_SELECTION_FAILED | Chrome could not use this output. | Retry or choose another endpoint. |
| AUDIO_CONTEXT_BLOCKED | Audio needs another user interaction to start. | Explicit Resume in a validated visible flow. |
| ROUTE_LIMIT_REACHED | The maximum number of active routes is in use. | Stop another route. |
| ENGINE_UNAVAILABLE | Audio routing was interrupted. | Reconcile and offer a fresh start. |
| OPERATION_TIMEOUT | The operation has not completed. | Refresh actual state before retry. |
| CAPTURE_ENDED | Chrome stopped capturing this tab. | Fresh authorized start. |

Retain the original browser error name in local diagnostics, but show a useful recovery action in the UI. Do not infer protected content from silence alone; muted or paused media is also silent.

## 15 Performance and audio quality targets

These are initial acceptance targets to measure and adjust explicitly before release:

| Area | Target and measurement |
| --- | --- |
| Start time | p95 within two seconds after authorization is complete, over 30 local trials. |
| Output switch | p95 within one second, excluding permission prompts and device wake-up. |
| Stop cleanup | No route-owned tracks or contexts remain two seconds after stop acknowledgement. |
| Level response | Visible control responds within 100 ms; audio gain uses a short ramp. |
| Long session | Four independent routes run for 60 minutes without observed dropouts attributable to the extension. |
| Silence handling | A route resumes after at least five minutes of source silence without a new capture. |
| Resource stability | After 100 start/stop cycles, live resource counts return to baseline and retained memory shows no continuing growth trend. |
| Hidden UI | No meter animation or periodic UI updates when all views are closed. |
| Privacy | No extension-originated outbound network traffic during the routing acceptance suite. |

Measure added routing latency relative to native playback with loopback or external capture where possible. Report sample rate, hardware, OS, driver, browser version, and measurement method. Report median and p95 over repeated trials.

Bluetooth, virtual devices, and OS mixing can add latency independently. Do not claim DAW-grade monitoring, bit-perfect playback, or synchronization between separate devices. A numeric latency promise requires actual measurements across the advertised platform matrix.

## 16 Validation strategy

### Automated logic tests

Use meaningful tests for route state transitions, cancellation races, revision handling, idempotency, preferences migration, endpoint identity, and resource cleanup.

Key cases include Stop during Start, Stop during Switch, rapid switches, worker restart during an acknowledgement, disappearing outputs, failed rollback, and multiple concurrent starts. Inject media and extension API adapters so failure paths are reproducible.

Test volume clamping, preservation of per-route mute under master mute, duplicate labels, changed device IDs, and rejection of malformed messages. Validate the packaged manifest and restrictive extension content security policy.

### Browser integration tests

Load the built unpacked extension in a visible supported Chrome test environment. Use local test pages that produce distinct deterministic signals per tab. Prove real tab capture and background playback; mocked APIs alone cannot establish feasibility.

Exercise the popup start flow, device permission denial/grant/revocation, manager reconnection, worker termination, tab navigation, context suspension, and extension reload. Headless or fake-device tests supplement rather than replace hardware checks.

### Hardware qualification matrix

| Configuration | What it proves |
| --- | --- |
| Built-in output plus USB headset | Independent physical endpoints. |
| Two playback endpoints from one multichannel interface | Separate endpoint routing without vendor-specific logic. |
| Physical output plus virtual audio endpoint | Routing into software mixers or recording tools. |
| HDMI/DisplayPort output | Display connection and disconnection behavior. |
| Bluetooth output plus wired output | Latency reporting and transport reconnection behavior. |
| Single exposed stereo endpoint | Honest limitations and useful default-only experience. |
| Denied device permission or no input device | Usable degraded mode and understandable setup failure. |

Use at least two unrelated hardware vendors before claiming broad interface compatibility. Publish only tested OS/browser/device-class combinations; the architecture remains device-agnostic.

### End-to-end acceptance scenarios

| ID | Scenario | Pass condition |
| --- | --- | --- |
| AT-01 | Start one tab on a fixed endpoint. | Signal reaches the selected endpoint; normal default playback is not duplicated. |
| AT-02 | Start two tabs with distinct test signals on two outputs. | Each signal appears only on its assigned path within the measured test setup. |
| AT-03 | Start four routes, including two sharing an endpoint. | All remain independently controllable for the long-session test. |
| AT-04 | Close UI and terminate the service worker. | Audio continues; reopening UI recovers accurate state. |
| AT-05 | Switch one route while others play. | Correct destination and status; other routes remain uninterrupted. |
| AT-06 | Disconnect a fixed output. | The affected route reports unavailable and applies the failure policy; observed browser failover is recorded. |
| AT-07 | Change the system default. | Default route follows it; fixed selections remain fixed where supported. |
| AT-08 | Mute, mute all, then unmute all. | Prior individual mute and level states are preserved. |
| AT-09 | Stop a route. | Capture ends, resources are released, and native playback returns without a persistent duplicate path. |
| AT-10 | Close or navigate the source tab. | Closure cleans up; navigation preserves capture when supported and handles ended capture explicitly. |
| AT-11 | Restart browser or reload extension. | Preferences persist; capture does not silently restart. |
| AT-12 | Deny or revoke device access. | No stuck prompt loop, leaked microphone track, or false success state. |
| AT-13 | Change source site/browser mute. | Existing user settings are respected; behavior is documented. |
| AT-14 | Run keyboard and screen-reader checks. | Every essential action and error recovery is accessible. |
| AT-15 | Inspect traffic and diagnostic export. | No transmitted audio; no unapproved browsing metadata in exports. |
| AT-16 | Exceed route limit or reject context creation. | Existing routes remain healthy; new start fails cleanly. |
| AT-17 | Sleep/wake and long silence. | Recovery matches the state policy and never silently selects an unintended fixed output. |
| AT-18 | Grant device access, return to source, and start. | Authorization flow works without assuming setup-page gestures authorize arbitrary tabs. |

## 17 Proposed implementation structure

Use TypeScript and a minimal local bundling pipeline. Begin with plain accessible HTML/CSS and small UI components; a large UI framework is optional, not an architectural dependency.

    manifest.json
    src/
      background/
        service-worker.ts
        route-controller.ts
        preferences.ts
      offscreen/
        offscreen.html
        engine.ts
        route.ts
        device-registry.ts
      popup/
        popup.html
        popup.ts
      manager/
        manager.html
        manager.ts
      setup/
        setup.html
        setup.ts
      shared/
        protocol.ts
        types.ts
        errors.ts
        validation.ts
      styles/
        app.css
    tests/
      unit/
      integration/
      fixtures/
    docs/
      manual-test-plan.md
      compatibility.md
      privacy.md
    README.md
    SPEC.md

This tree is proposed; the specification repository initially contains documentation only. Select and pin build/test dependencies during implementation. Bundle all executable code locally. Avoid inline script execution and remote code loading.

Suggested commands for the implementation phase: build, dev, typecheck, lint, test, test:integration, and package. The package command must emit a deterministic extension directory and a distributable archive excluding tests, secrets, local logs, and development fixtures.

## 18 Delivery milestones

### Milestone 0 Feasibility prototype

Implement the smallest real capture-to-output path. Prove two simultaneous tabs on two destinations, permission discovery, popup closure, silent-source persistence, and worker suspension on Windows Chrome.

Record whether explicit interaction is required to resume AudioContexts, whether the visible setup page's device permission carries to the offscreen engine, and how output loss behaves. Test machines with no usable microphone input as well as those with one.

Exit gate: demonstrate real endpoint isolation and a valid user flow. If a browser limitation blocks it, revise the architecture or narrow the claim before building the full UI.

### Milestone 1 Core routing

Implement route engine, start/switch/stop transactions, protocol validation, error handling, and cleanup. Pass logic tests and AT-01 through AT-05 plus AT-09.

### Milestone 2 Product interface

Implement popup, manager, device setup, volume/mute, accessibility, local preferences, and diagnostic export. Complete permission and restart scenarios.

### Milestone 3 Reliability and qualification

Complete hardware matrix, failure tests, long-session and resource tests, and latency measurements. Publish a compatibility document distinguishing passed, failed, and untested configurations.

### Milestone 4 Distribution

Produce the extension package, installation instructions, privacy statement, and store assets. Review permissions and packaging. Store publication is a separate release action.

## 19 Future routing capabilities

### Multiple destinations from one tab

Reuse one captured source stream and create an output branch for each selected destination. Each branch needs independent sink selection, gain, mute, and failure reporting. One missing output must not stop healthy branches.

Deduplicate destination IDs, define master versus branch volume, and measure CPU overhead. Independent device clocks and transport latency mean playback cannot be advertised as synchronized without a separate clock/drift design.

### Channel selection within an endpoint

Investigate explicit channel placement only when the browser reports sufficient output capacity. Web Audio exposes a maximum destination channel count, but physical mapping still requires OS/driver qualification. [Web Audio destination channels](https://www.w3.org/TR/webaudio-1.0/#AudioDestinationNode)

A prototype should emit a low-level identification signal into one channel at a time, verify actual channel order through loopback or hardware measurement, and use explicit discrete mapping where supported. Do not infer physical connector numbering or equate surround speaker positions with interface channel numbers.

The UI must expose capability and mapping limitations. A native companion would be a separate product decision if browser APIs cannot meet a later requirement.

### Scenes and site rules

Saved scenes should represent routing intent and device suggestions, not reusable capture grants. Loading a scene may require individual user activation for its source tabs. Missing or ambiguous devices require user selection.

## 20 Decisions and unresolved validation questions

| Item | Decision or validation needed |
| --- | --- |
| Hardware support | Capability-based and vendor-neutral. |
| Routing unit | Whole tab to browser-visible endpoint. |
| Version one fan-out | One destination per tab; multiple tabs concurrently. |
| Channel mapping | Deferred until measured and qualified. |
| Audio engine | One offscreen document, initially one context per route. |
| UI | Toolbar popup, full route manager, visible device setup page. |
| Persistence | Local preferences; live routes never automatically restored after browser restart. |
| Default output loss policy | Keep fixed-output route silent when loss is detected; no automatic fallback. |
| Native playback after crash | Must be measured and disclosed; cannot promise silence beyond engine control. |
| Device access without an input device | Prototype must establish supported behavior and degraded UX. |
| Context activation from background | Prototype must establish a reliable gesture/resume flow. |
| Platform portability | Windows qualification first; macOS/Linux only after the same suite. |
| Route capacity | Four-route release qualification, proposed eight-route limit. |
| Remote services | None in version one. |

The first release is ready when its required requirements pass, hardware evidence supports its compatibility claims, permissions match its documented behavior, and every known failure has a tested recovery path.

