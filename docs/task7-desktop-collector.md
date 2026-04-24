# Technical Plan: Task 7 - Desktop Collector (Tauri/Electron)

## Background & Motivation
The "killer feature" of TradeWitness is reducing friction in trade journaling. Instead of manually typing entry/exit prices and time, the user uses a minimalist desktop application that floats over their trading terminal. With a hotkey, it captures a screenshot of the trade execution window, allowing the backend (or later, an OCR service) to parse the details automatically.

## Scope & Impact
- Initialize a new desktop application project (e.g., in a new directory `apps/desktop` within the Turborepo, using Tauri or Electron).
- Implement global hotkey registration to trigger screen capture.
- Build a minimal UI overlay (a floating translucent window) for taking notes.
- Implement an HTTP client to upload the captured image via `multipart/form-data` to the `apps/app` backend.
- Create an API route in `apps/app` to receive the screenshot, upload it to Cloudflare R2 using the `r2.ts` utility, and save the record in Supabase.

## Implementation Steps
1. **Initialize App:** Setup Tauri (Rust + React) or Electron in `apps/desktop`.
2. **Screen Capture:** Utilize native APIs (e.g., Tauri plugins or Electron `desktopCapturer`) to capture a region of the screen.
3. **Backend Route:** Create `apps/app/src/app/api/trades/upload/route.ts`. It must:
   - Accept a `multipart/form-data` request containing an image file.
   - Convert the file to an `ArrayBuffer`.
   - Call `uploadScreenshot(buffer, filename, mimetype)` from `lib/r2.ts`.
   - Store the returned public URL in the `TradeTable` in Supabase.
4. **Integration:** Connect the desktop app to the backend. The desktop app will need to authenticate with Clerk (e.g., via a long-lived JWT or device token) so the backend knows which user owns the trade.

## Verification
- The desktop app compiles and runs locally.
- Pressing the hotkey captures the screen.
- The image is successfully uploaded to Cloudflare R2.
- A new trade record appears in the user's dashboard in `apps/app` with the screenshot URL attached.