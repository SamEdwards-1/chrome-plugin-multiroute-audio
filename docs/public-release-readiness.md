# Public release readiness

This is a release checklist, not a conformance or Chrome Web Store approval claim. Google reviews the submitted package and listing. Automated accessibility checks cannot replace keyboard, screen-reader, and hardware testing.

## Completed in the repository

- Manifest V3 uses only `activeTab`, `tabCapture`, and `offscreen`; no host permissions, content scripts, network calls, analytics, remote code, or persistent audio storage are present.
- The action name, description, and 16/32/48/128 px PNG icons reflect the current feature. The build copies icons, fonts, and the extension engine into `dist/` without the Vite mock.
- The popup explains local tab-audio and title use before the user starts a route. The optional microphone request is explicitly described before its button.
- Popup controls use native buttons, links, select, and details; asynchronous outcomes have a live status region; focus moves to a surviving control or section heading after route actions.
- Source scanning, axe-core DOM checks of the popup's initial/routed/expanded states and device-access page, contrast assertions, build, and logic tests run with `npm test` and `npm run build`.
- [The privacy policy](../PRIVACY.md) describes local processing, transient microphone access, retention, permissions, and Limited Use.

## Required before a public submission

1. **Manual accessibility pass in Chrome.** With only a keyboard, open the installed popup and test output selection, route start/switch/stop, other-tab focus/stop, route-details expansion, and the device-access page. Confirm visible focus, logical Tab order, and that focus remains usable after each action. Check at 200% and 400% zoom and with Windows high-contrast mode. Repeat the flows with NVDA and Chrome; listen to names, state changes, errors, and route details. Record any failures and fix them before a conformance claim.
2. **Hardware/browser acceptance.** Repeat the [feasibility manual](feasibility-manual.md) on at least two exposed outputs and a clean Chrome profile, including permission denial, device disappearance, browser restart, popup closure, and worker idle. The user's audio setup is currently unavailable, so this gate remains open.
3. **Privacy review.** Confirm the policy still matches the final code. Once merged, host it at a stable public URL and enter that URL in the Chrome Web Store dashboard. Complete the Privacy practices and Limited Use certifications. Disclose the single purpose and the use of tab audio, tab titles, output identifiers, and optional temporary microphone access accurately.
4. **Store listing and account.** Provide a real screenshot of the extension UI and the other required listing image assets, an accurate detailed description, support contact, category, and reviewer test instructions. Confirm developer account and two-step verification. Do not describe unimplemented volume, mute, arbitrary channel mapping, or support for outputs Chrome cannot enumerate.
5. **Submission package.** Build from the reviewed commit, inspect `dist/`, then zip the *contents* of `dist/` so `manifest.json` is at the ZIP root. Load that exact build unpacked in Chrome for the final checks. Increment the manifest version for every later upload.

Suggested single-purpose statement: “Route the audio of user-selected Chrome tabs to audio output devices exposed by Chrome, with one selected output per tab.”

Suggested short store description: “Send audio from individual Chrome tabs to different speakers, headphones, or other outputs available in Chrome.”

## References

- [Chrome extension accessibility guidance](https://developer.chrome.com/docs/extensions/develop/ui/a11y)
- [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies)
- [Chrome Web Store listing requirements](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
