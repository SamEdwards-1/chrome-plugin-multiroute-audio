# Multiroute Audio privacy policy

Last updated: October 14, 2026

Multiroute Audio routes audio from Chrome tabs you choose to audio outputs available on your computer. It does not create an account, record audio, run analytics, or send audio or browsing data to the developer or a remote server.

## Data used for routing

When you open the popup, the extension reads the current tab's title and identifier so it can show the source tab. When you choose **Route this tab**, Chrome provides a live audio stream for that tab. The extension sends the stream to the output you selected through Chrome's audio APIs. While a route is active, the extension keeps that tab's identifier, a shortened title, the selected output identifier, and the live audio objects in memory. The popup displays active route titles and output names so you can switch, focus, or stop a route. It does not read page content or store a browsing history.

The extension asks Chrome for the list of locally available audio outputs, including device identifiers and labels. Chrome and your operating system determine which outputs are exposed. The extension uses this information only to show choices and set a route's destination.

On the optional **Audio device access** page, you may explicitly request temporary microphone permission to reveal output names. The extension stops the microphone track immediately after Chrome responds. It does not connect that track to a route, record it, or send it anywhere. You can decline and still try the system default output.

## Storage, sharing, and retention

Routing state lives in the extension's memory while routes are active. The extension does not write tab audio, tab titles, output identifiers, or microphone data to persistent storage. Stopping a route or closing its tab removes its live route state; Chrome may also end routes when the browser or extension stops.

The extension does not share this data with the developer, advertisers, analytics providers, or other third parties. Chrome and the selected local audio output process audio as needed to provide the route.

## Permissions and your choices

- **activeTab** gives temporary access to the tab you invoke the extension on, including its title.
- **tabCapture** lets Chrome provide that tab's audio after you choose to route it.
- **offscreen** keeps a user-started route running after the popup closes.

You can stop any route from the popup. You can also revoke Chrome's microphone permission in browser settings, disable the extension, or uninstall it.

## Limited use

The use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements. Data accessed by this extension is used only to provide and improve its tab-audio routing feature.

Questions or privacy requests: [open an issue in the project repository](https://github.com/SamEdwards-1/chrome-plugin-multiroute-audio/issues).
