# Chrome Web Store Listing — Multiroute Audio

Last updated: 2026-10-17

## Launch status

First public submission in preparation. No Store item has been created or submitted in this session. Version 1.0.0 is the current upload candidate, superseding the 0.1.x packages. The developer account is ready according to the account owner. The privacy notice is public on the default branch and was verified without authentication (HTTP 200) on 2026-10-17. Chrome blocks automated access to the Web Store dashboard, so the account owner must upload and submit the item manually.

The developer reported independent successful testing on 2026-10-17: “I tested it independently and it works great.” This is a user report, not an independently witnessed acceptance matrix. The earlier popup-opening issue resolved without a code change and its cause is unconfirmed. No WCAG conformance or universal hardware compatibility claim is made.

## Store listing

**Extension name:** Multiroute Audio

**Short description:** Route audio from individual Chrome tabs to available output devices on your computer.

**Detailed description** (paste as plain text):

```text
Send audio from individual Chrome tabs to different speakers, headphones, or other audio outputs available on your computer.

Choose an output for each tab and keep several tabs routed at the same time. Audio keeps playing after you close the popup. Reopen it to switch an output, return to a source tab, or stop a route and restore normal tab playback.

HOW TO USE
1. Open a regular web page that plays audio.
2. Click Multiroute Audio in the Chrome toolbar.
3. Choose an available audio output and select Route this tab.
4. Repeat on another tab to send it to a different output.
5. Use Active routes to switch back to a source tab or stop its route.

AVAILABLE OUTPUTS
Destinations depend on what Chrome, your operating system, and your audio driver expose. Hardware channels appear separately only when they are exposed as separate browser outputs. Each tab uses one selected output. Volume controls, mute controls, saved routes, and arbitrary channel mapping are not included in this version. Routes may end when the browser or extension stops; reopen the source tabs to start them again.

PRIVACY
Tab audio, titles, and output information are processed only on your device to provide routing. Audio is not recorded, uploaded, or shared with the developer. There are no analytics or accounts. The optional Audio device access page can request temporary microphone permission to reveal device names. Its microphone track is stopped immediately and is never routed or recorded. You can decline that request and try the system default output.

Chrome on Windows is the developer-tested configuration. Other systems and audio setups have not been qualified.

SUPPORT
Report problems or request features at https://github.com/SamEdwards-1/chrome-plugin-multiroute-audio/issues

Privacy policy: https://github.com/SamEdwards-1/chrome-plugin-multiroute-audio/blob/main/PRIVACY.md
```

**Category:** Select the dashboard's productivity/tools category (for example, Tools under Productivity if offered).

**Single purpose:** Route audio from user-selected Chrome tabs to output devices exposed by Chrome, with one selected output per tab.

**Primary language:** English (United States).

## Graphics and assets

| Asset | Dimensions | Path / status |
| --- | --- | --- |
| Store icon | 128 × 128 PNG | `store-assets/store-icon.png`; generated with 96 × 96 artwork and transparent padding |
| Screenshot 1 | 1280 × 800 JPEG or PNG | Capture `store-assets/screenshot.html` through the local Vite preview; current UI with clearly identified example data |
| Small promo tile | 440 × 280 PNG | `store-assets/promo.png`; generated from `store-assets/promo.svg` |
| Marquee promo tile | 1400 × 560 | Optional; omitted |

The small promo tile is required by the current official [image guidance](https://developer.chrome.com/docs/webstore/images). Screenshots must show the current product. Do not present sample routes as evidence of a live hardware test. The screenshot composition labels its example tabs and outputs.

## Permissions justification

| Permission | Dashboard justification |
| --- | --- |
| activeTab | When the user invokes the toolbar popup, temporarily identify the selected source tab and read its title and URL to display its name and check that it is a supported web page. Access is limited to the invoked tab; the extension does not request persistent access to websites. |
| tabCapture | Obtain the live audio of the tab the user explicitly chooses to route. That stream is played through the selected local output and is never recorded or transmitted to a server. |
| offscreen | Keep user-started audio routes playing while the toolbar popup is closed. The audio engine remains open only while needed for live routes or output discovery. |

No host permissions, content scripts, remotely hosted code, analytics, external network calls, or persistent routing storage. All executable code, styles and fonts are packaged locally. If asked whether remote code is used, select **No**.

Optional microphone access is requested only by the device-access page's explicit button. It obtains device labels and immediately stops the input track. It does not capture input audio for routing.

## Privacy and data use

Disclose local processing. Do not select a blanket “does not handle user data” statement: Google's [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) requires disclosure even when data stays on the device.

| Dashboard data type | Handling |
| --- | --- |
| Website content | Yes: live tab audio and the selected tab's title are processed locally for routing and display. No recordings or persistent content storage. |
| Web history | Yes: the invoked tab's URL is inspected for eligibility and its identifier/title identifies the source route. No navigation monitoring, browsing-history database, or persistent history is collected. |
| Personal communications | The chosen tab's audio may contain a call or other communication. It is routed locally only at the user's request, without recording, transcription, analysis or upload. Disclose this handling if the dashboard includes this category. |
| Personally identifiable information | No dedicated collection of names, addresses, email addresses or account identifiers. |
| Health / financial / authentication information | No dedicated collection, extraction or analysis. Any content in the user-selected live audio is processed only as that audio stream. |
| Location | Not requested. |
| User activity | No click, keystroke, mouse, scroll or navigation tracking. |
| Audio output information | Device labels and identifiers are held in memory to display choices and select a destination; not uploaded or saved. |
| Microphone | Optional temporary permission for device labels; obtained tracks are stopped immediately and never connected to playback or recording. |

**Transmitted off device:** No extension-initiated transmission. Audio is delivered to the output device selected by the user; that device may itself be wireless or virtual.

**Retention:** Live route state is removed on stop, tab closure, or termination of the extension/browser. No extension storage or server retention.

**Certifications supported by the code:** Data is not sold or shared with the developer/advertisers; data is used only for the routing purpose; data is not used to determine creditworthiness or for lending. The account owner must review and complete the dashboard certifications.

## Privacy policy

**Verified public URL:** https://github.com/SamEdwards-1/chrome-plugin-multiroute-audio/blob/main/PRIVACY.md

The public page includes the policy, publisher name and contact email. It requires no sign-in.

## Distribution

**Visibility:** Public.

**Price:** Free. No paid features or subscriptions.

**Regions:** Use regions the publisher is eligible to serve. The account owner must choose any applicable trader/business declarations based on their actual circumstances; these have not been inferred.

## Developer information

**Publisher name:** Ducks in a Row.

**Public contact email:** ducksinarowinteractive@gmail.com. Chosen by the account owner; verify it in the dashboard.

**Support URL:** https://github.com/SamEdwards-1/chrome-plugin-multiroute-audio/issues

**Homepage URL:** https://github.com/SamEdwards-1/chrome-plugin-multiroute-audio

## Reviewer instructions

```text
No login, account, subscription, or external service is required.

1. Use Chrome 116 or later on Windows. To verify distinct destinations, make at least two output devices available to Chrome, such as speakers and headphones. Arbitrary interface channels are not exposed unless the driver presents them as separate browser outputs.
2. Open an ordinary HTTPS page that plays audio. Invoke the extension's toolbar popup, choose an output, and click Route this tab.
3. Close the popup: audio should continue. Open another audio tab and route it to a different exposed output. Reopen the popup to see both routes.
4. Switch the current tab's output. Use a route's title to return to its source tab, or Stop route to restore normal tab playback.
5. The device-access link opens a separate page. If labels are hidden, use its explicit temporary microphone-permission button. This is optional; denying it must not prevent trying the system default. The input track is immediately stopped and never routed or recorded.
6. Chrome internal pages and other restricted pages cannot be captured. Browser or extension restart can end routes; they are not saved or silently restarted.

The extension processes tab audio and titles locally, contains no remote code, and does not record or upload audio. The developer-tested environment is Chrome on Windows.
```

## Version history

| Version | Date | Changes | Status |
| --- | --- | --- | --- |
| 1.0.0 | 2026-10-17 | First public release package: per-tab routing, output switching, device discovery, accessibility fixes, privacy disclosures; theme-colored scrollbars appear while scrolling and hide after 700 ms idle | Prepared; not submitted |
| 0.1.x | 2026-10-17 | Internal preparation packages | Superseded; not submitted |

## Remaining launch steps

- [x] Account owner reports the developer account is ready. Any dashboard-specific verification remains with the owner.
- [x] Public publisher name and support email chosen; verification in the dashboard remains with the account owner.
- [x] Merge launch preparation and verify the public privacy-policy URL (PR #12).
- [ ] Review the exact production build loaded from `dist/` in Chrome, including keyboard navigation. Automated tests do not certify accessibility.
- [ ] Save the current UI screenshot at 1280 × 800 and upload it, `store-icon.png`, and `promo.png`.
- [ ] Upload `release/multiroute-audio-1.0.0.zip` as a new item; select Public distribution; complete listing and privacy fields from this document.
- [ ] Complete any dashboard-specific publisher/trader declarations truthfully, then submit for Google's review. Submission is not publication or approval.

Registration: https://chrome.google.com/webstore/devconsole/

Current registration guidance: https://developer.chrome.com/docs/webstore/register/
