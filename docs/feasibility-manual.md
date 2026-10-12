# Milestone 0 manual validation

This plan requires a visible desktop Chrome session and two browser-visible output endpoints. Record Chrome version, OS, endpoint names, driver details, date, and whether observations came from hearing, hardware mixer meters, or loopback capture. A Windows device inventory alone does not establish that Chrome can select an endpoint.

## Preparation

1. From the repository root, run `python -m http.server 8765` (or `py -m http.server 8765`). Keep that terminal open. No external network service is used.
2. Open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select this repository root. Pin the extension toolbar button if needed.
3. Open `http://localhost:8765/fixtures/tone.html?hz=220` in one tab and `http://localhost:8765/fixtures/tone.html?hz=440` in another. Click **Start tone** on each page.
4. On the first source tab, open the extension popup. Open **Audio device access and diagnostics**. Record the outputs shown before permission, whether **Choose an output** is enabled, and whether endpoint labels and IDs become available after selection.
5. If the output picker is unavailable or does not expose the needed endpoint, use **Reveal outputs using microphone permission** only if you want to test that flow. Record the permission result and confirm the temporary input track stops. Return to the source tab and reopen the popup. A machine with no usable microphone input must also be checked; denial or failure should leave System default usable.

## Required route observations

| Check | Procedure | Record |
| --- | --- | --- |
| Single route | Choose a fixed output and click **Route this tab** on 220 Hz tab. | Popup result, offscreen context state, 220 Hz on selected endpoint, and whether ordinary default playback duplicates it. |
| Two independent routes | On 440 Hz tab choose another physical or virtual output and route it. | 220 Hz only on first path and 440 Hz only on second, verified with separate meters or loopback recordings. Hearing one device at a time is weaker evidence. |
| Popup closure | Close popup, leave both tabs playing for at least one minute. | Whether both endpoint signals continue and whether reopened popup shows both routes. |
| Silent source | Stop the 220 Hz page tone for five minutes, then restart it without restarting the route. | Track/context state during silence and whether the same endpoint resumes. |
| Worker suspension | Close the extension popup **and fully close service worker DevTools before starting the idle timer**. Do not click **Inspect** during the wait; that wakes or keeps the worker active. Read only the inactive status on `chrome://extensions`, observe the routed outputs, then reopen the popup. | Whether both routes continue during confirmed suspension and status reconciles after worker restart. An open service worker inspector invalidates this check. |
| Context interaction | Reload extension, restart a route using the toolbar click. | Whether `AudioContext.resume()` succeeds in the offscreen page without another user gesture; record exact exception if it fails. |
| Setup permission sharing | Grant/select an output on setup page, reopen popup, then start a route to it. | Whether the offscreen engine enumerates and actually uses the same endpoint. |
| Output switch | With both routes playing, switch one route in its source tab's popup. | Correct destination after switch and whether the other route is interrupted. |
| Output loss | With a fixed route active, disconnect or disable its endpoint. | Context state, audible/meter path, any Chrome fallback, and both the selected and browser-reported sink labels in the popup. A reported sink ID does not prove the physical path. This prototype has no output-loss monitor, so failover may occur. |
| Stop cleanup | From a third, unrelated tab, use each **Stop route** button in the popup's **Active routes** list. | Only the chosen route stops, its source tab returns to native playback, the other route continues, and the offscreen document closes after the last route. |
| Route navigation | From a third, unrelated tab, click a route's underlined tab name and arrow icon. | Chrome activates that source tab and focuses its window; the route continues playing. The name shown is the title captured when the route started. |
| No microphone | Repeat discovery and default routing on a system without usable audio input or with input permission denied. | Available endpoints, permission errors, and whether default output still works. |

After each test run, click **Stop tone** on both fixture pages and stop any remaining extension routes. Start the tones again only when the next audio observation is ready.

The fixture has fixed 220 Hz and 440 Hz sine sources at approximately -30 dBFS. It deliberately starts only after a page click to avoid autoplay restrictions. The tones are useful for identifying paths; they do not measure latency or prove a path unless separately captured or metered.

## Baseline measurements

Record the Chrome version, Windows build, output names shown in Chrome, driver or virtual-device versions, sample rates, and how each path was observed. The popup reports **start**, **switch**, and **stop command** round-trip times after each action. Copy those values before closing it. They measure extension command completion, **not audible latency**.

For an audio-path comparison, record at least ten trials each of native playback, first route start, and output switch with a loopback or external recorder that can distinguish the destinations. Use the same tone source, output level, recorder, and timing method in every trial. Record the delay from the corresponding user action to the first stable signal at the destination, then report median and p95 for each condition. If the action and audio cannot be captured on a shared clock, report command times and audio observations separately rather than inventing an end-to-end latency number.

For resource use, open Chrome Task Manager with **Shift+Esc** and record its CPU and memory readings for the extension/offscreen process, if Chrome exposes one, after 60 seconds at each state: no route, one route, two routes, and after stopping both routes. Note when Chrome combines processes or hides the offscreen document; do not attribute a shared process's usage solely to this extension. Keep the tones stopped between measurement runs.

| Trial | Native action-to-signal ms | Start command ms | Start action-to-signal ms | Switch command ms | Switch action-to-signal ms | CPU / memory / process note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

The report should include the raw readings or a link to them, the median and p95 calculation, and any unmeasurable field explicitly marked **untested**.

For console diagnostics, open `chrome://extensions` and inspect the extension service worker or offscreen document. A route's popup state reports `AudioContext.state` and audio track `readyState`; these indicate a running graph, not physical audibility. Record exact Chrome errors without copying sensitive browsing data.

## Go/no-go evidence

Milestone 0 is **go** only after a visible Chrome run demonstrates two simultaneous fixture tabs reaching distinct selected endpoints, continued routing after popup closure and confirmed worker suspension, workable device permission flow, and source recovery after five minutes of silence. Record any interaction needed for context resume, permission sharing, no-input behavior, and output loss. If a necessary browser capability fails, revise the architecture or supported claim before core routing work.
