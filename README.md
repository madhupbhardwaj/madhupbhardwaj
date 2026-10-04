# Madhup: 3D trial

This is the full portfolio with an interactive Mobius strip between the introduction and the quote, a scroll-drawn sine curve beside the projects, and project previews that straighten as they enter view. It is a separate trial of the design.

## Try it first

Extract the ZIP and open `index.html` in Chrome, Safari, or Edge. Keep the files and the `assets` folder together. No installation or build command is needed.

The strip rotates slowly. Drag to rotate it yourself; on a phone, drag sideways. Vertical swipes still scroll the page. Surface and Wireframe change its appearance. Trace the edge follows its single continuous boundary, then stops. The icon buttons pause animation and reset the view. Keyboard users can focus the model and use the arrow keys or Home.

The existing reduced-motion button also stops the sculpture. Manual rotation remains available. Devices without WebGL display a still image instead.

## Put this trial on GitHub / Vercel

Upload the extracted files into the same repository folder as your current `index.html`. Do not upload the ZIP itself or nest this folder inside the site.

Changed files:

- `index.html`
- `style.css`
- `script.js`

New required files:

- `assets/mobius.js` (includes Three.js; no external 3D script needed)
- `assets/mobius-still.png`
- `assets/THREE-LICENSE.txt`

The project images are included for a complete local preview and are unchanged. Existing hosting settings can stay as they are. This version updates `script.js` too: upload all three main files and keep the `assets` folder together.

The wave follows normal page scrolling and retracts when you scroll upward. Reduced motion displays the complete curve and keeps project previews straight.

## Edit the quote

Search for `QUOTE CARD` in `index.html`. Edit the paragraph, or change `data-enabled="true"` to `data-enabled="false"` to hide the card.

## Verification

The scroll additions were also checked at 1440px, 390px, and 320px: the curve advances with scroll, each preview straightens, reduced motion produces a static view, and the gutter remains inside the viewport without horizontal overflow.

Tested in Chromium with desktop (1440px) and phone (390px and 320px) viewports: visible model pixels and framing, mouse and touch rotation, keyboard controls, pause, reset, wireframe mode, the complete edge trace, reduced motion, vertical touch scrolling, and the no-WebGL fallback. The existing break-the-heading and maths-proof features also passed interaction checks. Physical iOS/Android hardware and Safari have not been tested.
