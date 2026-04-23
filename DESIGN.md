---
name: SafeVixAI
tagline: AI-powered tactical road safety platform for India
platform: web-pwa-next15
framework: next15-typescript-tailwind-shadcn
base_style: tactical-safety-command-terminal
modes: [dark-tactical, light-operational]
influenced_by: Linear (sidebar precision + dark depth) + VoltAgent (terminal energy + warm borders)
---

# SafeVixAI — Complete Design System

## Philosophy

SafeVixAI is a life-safety command terminal, not a consumer app. The UI communicates two modes:
**Tactical Emergency** (crash detected, SOS active, seconds matter) and **Operational Normal**
(browsing first aid, checking fines, reporting hazards). Dark tactical is the native medium.

From **Linear**: precise sidebar, ultra-thin semi-transparent borders, luminance stepping for depth,
Inter Variable with OpenType features.
From **VoltAgent**: terminal-native energy, warm charcoal borders, compressed headings, code-block
aesthetic for data display.

Core rules:
- Red `#DC2626` = danger/emergency. Never decorative.
- Green `#1A5C38` / `#00C896` = safety/brand/system online/success.
- White-opacity borders only — never solid dark borders on dark surfaces.
- Every page has a terminal header: codename + SENTINEL ACTIVE dot.
- App name in UI: **SafeVixAI** (never "RoadSoS")

---

## 1. Color Tokens

### Brand
```
--color-brand:          #1A5C38   /* Forest green — primary brand */
--color-brand-hover:    #145030   /* 10% darker, hover */
--color-brand-light:    #00C896   /* Bright mint — active states, online indicators */
--color-brand-surface:  rgba(26,92,56,0.12)
--color-brand-glow:     rgba(0,200,150,0.20)
```

### Emergency
```
--color-emergency:      #DC2626   /* The one red — SOS, emergency cards, crash overlay */
--color-emergency-dark: #B91C1C   /* Pressed SOS, critical priority bg */
--color-emergency-dim:  rgba(220,38,38,0.15)
--color-emergency-glow: rgba(220,38,38,0.30)
--color-warning:        #D97706
--color-warning-dim:    rgba(217,119,6,0.12)
--color-info:           #3B82F6   /* Police blue */
--color-ambulance:      #EA580C   /* Ambulance markers only */
```

### Challan Special
```
--color-challan-amount: #00E676   /* ₹10,000 large fine display */
--color-challan-active: #00C896   /* Active vehicle card border/checkmark */
```

### Dark Mode Surfaces (default)
```
--color-bg:         #0A0E14   /* Page canvas */
--color-surface-1:  #111520   /* Cards, sidebar */
--color-surface-2:  #181D2A   /* Hover, nested panels */
--color-surface-3:  #1F2535   /* Active states */
--color-surface-4:  #252B3A   /* Modals, dropdowns */
--color-border:     rgba(255,255,255,0.07)
--color-border-md:  rgba(255,255,255,0.12)
--color-border-warm: #2A2E3A  /* Solid warm border — VoltAgent style */
--color-border-green: rgba(0,200,150,0.30)
--color-border-red:   rgba(220,38,38,0.40)
```

### Light Mode Surfaces
```
--color-bg-light:         #F0F2F5
--color-surface-1-light:  #FFFFFF
--color-surface-2-light:  #F7F9FC
--color-border-light:     #E2E6ED
--color-border-md-light:  #CDD3DC
```

### Text
```
/* Dark mode */
--text-1:     #F0F4F8   /* Primary — not pure white */
--text-2:     #A8B4C4   /* Secondary, descriptions */
--text-3:     #6B7A8D   /* Tertiary, timestamps, disabled */
--text-green: #00C896   /* Active, online, brand */
--text-red:   #FF6B6B   /* Emergency text */
--text-amber: #F59E0B   /* Warning text */

/* Light mode */
--text-1-light: #0F1A2E
--text-2-light: #4A5568
--text-3-light: #8A95A3
```

---

## 2. Typography

Font: `Inter Variable` — ALWAYS with `font-feature-settings: "cv01", "ss03"` globally.
Monospace: `'JetBrains Mono', 'SF Mono', ui-monospace, monospace` — for IDs, coordinates,
fine amounts, version numbers.

```css
html { font-family: 'Inter Variable', 'Inter', -apple-system, sans-serif;
       font-feature-settings: "cv01", "ss03"; -webkit-font-smoothing: antialiased; }
```

| Role | Size | Weight | Line-H | Letter-spacing | Used for |
|---|---|---|---|---|---|
| Terminal Overline | 11px | 600 | 1.3 | 0.10em UPPERCASE | "EMERGENCY PROTOCOL TERMINAL", "SENTINEL ACTIVE" |
| Page Codename | 24–28px | 700 | 1.0 | -0.02em | "PROTOCOL TERMINAL", "ESTIMATION TERMINAL" — compressed |
| Hero Amount | 48–56px | 800 | 1.0 | -0.03em | ₹10,000, countdown seconds — monospace font |
| H1 Page Title | 20px | 600 | 1.3 | -0.01em | "FIRST AID HUD", "REAL-TIME ROAD HAZARD" |
| H2 Card Title | 16px | 600 | 1.4 | normal | "CPR", hospital name, "ESTIMATION TERMINAL" |
| Section Label | 13px | 600 | 1.4 | 0.05em UPPERCASE | "LOCATION LOCK", "MISSION PROTOCOL", "VIGILANCE DEFAULTS" |
| Body | 14px | 400 | 1.6 | normal | Descriptions, chatbot messages |
| Body Small | 13px | 400 | 1.5 | normal | Metadata, distance, step text |
| Caption | 12px | 400 | 1.4 | normal | Status labels, filter chip text |
| Micro | 11px | 600 | 1.3 | 0.08em UPPERCASE | "PRIORITY P0", "OFFLINE", "TACTICAL CENTER" |
| Mono ID | 13px | 400 | 1.4 | 0.02em | User IDs, GPS coords, MVA_ACT_2019, SV-2024-AI |

---

## 3. Spacing

Base: 4px. Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64px.

Standard card padding: **16px**. Feature card padding: **20px**. Emergency card: **24px**.
Section gaps: 32px. Page top padding: 24px. Between major sections: 48px.

Layout dimensions:
- Sidebar: 192px wide, full height, fixed
- Header: 52px tall
- Bottom nav (mobile): 64px tall
- Emergency dial bar (sidebar bottom): 80px

---

## 4. Border Radius

```
2px   — Micro badges (OFFLINE, PRIORITY P0 tags)
4px   — Small inline elements
6px   — Buttons, inputs, filter chips (DEFAULT interactive)
8px   — Cards, panels, dropdowns (DEFAULT containers)
10px  — Feature cards, vehicle selector cards (Challan)
12px  — Large panels, Area Intelligence, auth card
16px  — Emergency SOS hero card
9999px — Pills, rounded chips, status dots
50%   — Avatars, icon buttons, status dot circles
```

---

## 5. Shadows

```css
/* Dark mode card */
box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.4);

/* Panel / dropdown */
box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);

/* Modal / full overlay */
box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08);

/* Emergency SOS card glow */
box-shadow: 0 0 24px rgba(220,38,38,0.35), 0 0 0 1px rgba(220,38,38,0.5);

/* Brand/green element glow */
box-shadow: 0 0 12px rgba(0,200,150,0.20), 0 0 0 1px rgba(0,200,150,0.25);

/* Light mode card */
box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
```

---

## 6. Components

### Buttons

**Emergency Primary (Red)**
```css
bg: #DC2626; color: white; padding: 12px 24px; border-radius: 6px;
font: 14px/700 uppercase letter-spacing 0.04em;
hover: #B91C1C; active: scale(0.97);
glow: box-shadow 0 0 12px rgba(220,38,38,0.35);
```

**Brand Primary (Green)**
```css
bg: #1A5C38; color: white; padding: 10px 20px; border-radius: 6px;
font: 14px/600; hover: #145030;
```

**Terminal Green (outline-style)**
```css
bg: rgba(0,200,150,0.08); color: #00C896;
border: 1px solid rgba(0,200,150,0.25); padding: 10px 20px; border-radius: 6px;
font: 14px/600; hover: bg rgba(0,200,150,0.15);
Used: "DETAILED REPORT →", "Start Guide →"
```

**Ghost (Dark)**
```css
bg: rgba(255,255,255,0.03); color: #F0F4F8;
border: 1px solid rgba(255,255,255,0.10); padding: 10px 16px; border-radius: 6px;
font: 14px/500;
hover: bg rgba(255,255,255,0.06), border rgba(255,255,255,0.18);
Used: "EDIT PROFILE", "Cancel", secondary actions
```

**Filter Chip**
```css
/* Inactive */
bg: rgba(255,255,255,0.04); color: #A8B4C4;
border: 1px solid rgba(255,255,255,0.08); border-radius: 9999px;
padding: 6px 14px; font: 12px/500;

/* Active */
bg: rgba(26,92,56,0.20); color: #00C896;
border: 1px solid rgba(0,200,150,0.35);
```

### Cards

**Standard Dark Card**
```css
bg: #111520; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 16px 20px;
hover: border-color rgba(255,255,255,0.12), bg #181D2A;
```

**Emergency SOS Hero Card**
```css
bg: linear-gradient(135deg, #1A0A0A 0%, #2D0808 100%);
border: 1px solid rgba(220,38,38,0.40); border-radius: 16px; padding: 24px;
box-shadow: 0 0 24px rgba(220,38,38,0.25);
Contains: shield icon + "EMERGENCY OVERRIDE" label + "EMERGENCY SOS" + status + "CALL 112 NOW →"
```

**Data Terminal Card (Challan vehicle selector)**
```css
bg: #111520; border: 1px solid #2A2E3A; border-radius: 10px; padding: 16px;
Active/selected: border: 1px solid #00C896; bg: rgba(0,200,150,0.06);
```

**Profile Identity Card**
```css
bg: #181D2A; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px 16px;
Label: 11px/600/uppercase; Value: 16px/600 "NOT SET";
```

**QR Emergency Card**
```css
bg: #111520; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px;
Contains:
  - "EMERGENCY QR CODE" overline header (11px/600/uppercase/#00C896)
  - QR code: 128×128px, white on dark surface, 8px radius container
  - Name + blood group + emergency contact below QR
  - "SCAN IN EMERGENCY — NO APP NEEDED" caption (12px/400/#6B7A8D)
  - "Download QR" + "Share" buttons (ghost style)
Location: Profile page, below BIO SIGNATURE + EMERGENCY CONTACT cards
```

**Auth / Login Card**
```css
bg: #111520; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
padding: 32px; max-width: 400px; margin: 0 auto;
Contains:
  - SafeVixAI logo (centered, 48px)
  - "OPERATOR AUTHENTICATION" overline
  - Email input → "REQUEST OTP" (brand green)
  - OTP 6-digit input (monospace) → "VERIFY & ENTER" (brand green)
  - Divider "OR"
  - "CONTINUE AS GUEST" ghost button
  - Privacy note: 12px/400/#6B7A8D
```

### Inputs

**Standard**
```css
bg: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
border-radius: 6px; padding: 10px 14px; font: 14px; color: #F0F4F8;
placeholder: #6B7A8D;
focus: border rgba(0,200,150,0.50), box-shadow 0 0 0 3px rgba(0,200,150,0.12);
```

**Toggle / Switch**
```css
Track inactive: bg rgba(255,255,255,0.10); width: 44px; height: 24px; border-radius: 9999px;
Track active: bg #1A5C38;
Thumb: white, 20px circle;
Used for: Crash Detection, Push Hub, V8 Offline Mode, Speed Warnings toggles
```

### Badges

**Terminal Tag** (overline status chips)
```css
font: 11px/600 uppercase letter-spacing 0.08em; padding: 2px 8px; border-radius: 4px;

OFFLINE:           bg rgba(217,119,6,0.15);   color #F59E0B;
PRIORITY P0:       bg rgba(220,38,38,0.15);   color #F87171;
SENTINEL ACTIVE:   bg rgba(0,200,150,0.12);   color #00C896;
TACTICAL CENTER:   bg rgba(59,130,246,0.15);  color #60A5FA;
TERMINAL ACTIVE:   bg rgba(0,200,150,0.10);   color #00C896;
SATELLITE LOCK:    bg rgba(99,102,241,0.15);  color #818CF8;
DISPATCH SENTINEL: bg rgba(0,200,150,0.10);   color #00C896;
TAMIL / state:     bg rgba(220,38,38,0.10);   color #F87171;
```

**Status Dot**
```css
width: 6px; height: 6px; border-radius: 50%;
Online:    bg #00C896; animation: pulse 2s ease-in-out infinite;
Emergency: bg #DC2626; animation: pulse 0.8s ease-in-out infinite;
```

### Navigation

**Sidebar (desktop)**
```css
bg: #0D1119; width: 192px; height: 100vh; position: fixed; left: 0;
border-right: 1px solid rgba(255,255,255,0.06);

App name: 15px/700 #F0F4F8 — "SafeVixAI"
"SYSTEM INTEGRATED": 10px/600/uppercase color #00C896

Nav item inactive: padding 10px 16px; border-radius 6px; font 14px/500; color #A8B4C4;
Nav item active: bg rgba(26,92,56,0.15); color #F0F4F8; border-left 2px solid #1A5C38;

EMERGENCY DIAL section:
  Label: "EMERGENCY DIAL" 11px/600/uppercase color #DC2626
  2×2 grid: icon + number (16px/700/monospace) + label (10px/400)
  112 Emergency | 102 Ambulance | 100 Police | 1033 Highway
```

**Bottom Nav (mobile)**
```css
bg: #0D1119; border-top: 1px solid rgba(255,255,255,0.07); height: 64px;
5 tabs: Map / AI Chat / Locator / Report / First Aid
Active: icon color #1A5C38, label 11px visible;
Inactive: icon #6B7A8D, no label;
```

**Header Bar**
```css
bg: rgba(10,14,20,0.92); backdrop-filter: blur(8px);
border-bottom: 1px solid rgba(255,255,255,0.06); height: 52px;
Left: hamburger (mobile) OR SafeVixAI app icon
Center: search bar (focus ring = green, mic button = green)
Right: connectivity toggle (Online/Offline) + theme icons (☀/🌙/🖥) +
  operator name chip (green pill, only when authenticated) + "SECURE" badge
  NOTE: NO login button in header — login is only accessible via /login URL
```

---

## 7. Page Patterns (all pages)

### Universal Terminal Header (every page)
```
[TERMINAL CODENAME]   — 11px/600/uppercase/letterspace 0.10em, left-aligned
+ SENTINEL ACTIVE dot — 6px green dot + "SENTINEL ACTIVE" 10px/500 #00C896
[CONTEXT CHIP]        — optional tinted badge (TACTICAL CENTER, DISPATCH SENTINEL etc)
[PAGE HERO TITLE]     — 24-28px/700, line-height 1.0, compressed
[SUB-DESCRIPTION]     — 12px/400/uppercase, #A8B4C4, letter-spacing 0.05em
```

### Map / Home (`/`)
```
Layout: Full-viewport MapLibre map + collapsible right panel (Area Intelligence)
Filter chips row at top: ALL, Hospitals, Police, Ambulance, Fire, Safe Spaces
"Enable Location" green button

Area Intelligence panel (right, desktop only):
  Header: "AREA INTELLIGENCE" (bold) + Live/Cached connectivity badge + GPS city/state
  Status card: dynamic color based on open hazard count:
    0 open → green "Secure Region" + shield icon
    1-2 open → amber "Caution Zone" + warning icon
    3+ open → red "High Risk Area" + shield icon
  Stats row: 2-col grid showing Services count + Hazards count (from Zustand store)
  Active Hazards list: up to 4 cards with issue type, road name, distance, severity badge (S1-S4)
  Empty state: "Scanning Area..." with "Allow location to activate live hazard intelligence"
  AI Sentinel card: "Monitoring Active" with green pulse dot

Map markers: red=hospital, blue=police, orange=ambulance, yellow=blackspot cluster
"NO ACTIVE ALERTS NEARBY" bottom sheet (mobile)
Floating SOS: 56px red circle, fixed bottom-right
```

### Assistant / Chat (`/assistant`)
```
~~CRITICAL BUG: Blank on mobile.~~ **FIXED** ✅ — uses calc(100dvh - 52px - 64px) + min-h-0 flex.
Layout: Full-height chat column
Messages: flex-col
  User bubble: bg rgba(26,92,56,0.20), right-aligned, 8px radius
  AI bubble: bg #111520, left-aligned, "SafeVixAI" label + timestamp
"SUGGESTED INQUIRIES" overline + 2-3 quick pill chips below AI welcome message
Bottom bar: mic icon + text input + send button
Provider badge on AI message: which LLM answered (small tag)
```

### Locator (`/locator`)
```
Terminal: "EMERGENCY RESOURCE DISPATCH" + SENTINEL ACTIVE
Map top 40vh + filter tabs + results list bottom
Tabs: ALL, HOSPITAL, POLICE, FIRE, MECHANIC, TOWING (pill style, horizontal scroll)
Traffic:OFF / Safe Spaces:OFF toggles (small, top-right of map)
Empty state: icon + "No services found for this filter" + "Try switching filter" + retry button
Result card: facility name (16px/600) + distance badge + type chip + phone + directions buttons
```

### First Aid (`/first-aid`)
```
Terminal: "FIRST AID DISPATCH HUD" + SENTINEL ACTIVE
Search bar below terminal header
Card grid: 2col (tablet) / 3col (desktop) / 1col (mobile)
Each card: PRIORITY P0 + OFFLINE badges, icon circle (48px/10px radius/semantic bg),
  title ALL-CAPS 16px/600, description 13px/400, "Start Guide →" button
Move "NORMAL MODE" badge to header bar (not floating in page body)
```

### Report (`/report`)
```
Terminal: "HAZARD DISPATCH TERMINAL" + SENTINEL ACTIVE
Sub: "DISPATCH SENTINEL" chip + "REAL-TIME ROAD HAZARD REPORTING" hero
Two bottom panels: "LOCATION LOCK" + "EVIDENCE CAPTURE"
"NEARBY HELP" secondary button (top-right)
"REPORT DISPATCH FORM" below panels (scrollable)
Submit → authority card + report ID toast
```

### Challan (`/challan`)
```
Terminal: "CHALLAN TERMINAL" + SENTINEL ACTIVE
Left: Result panel — "TOTAL LIABILITY" + ₹AMOUNT (48px monospace #00E676) +
  breakdown + imprisonment warning + "DETAILED REPORT →" button
Right: 4-step form
  Step 01: VIOLATION PROTOCOL dropdown + TAMIL state chip
  Step 02: VEHICLE IDENTIFICATION — 4 cards (2-WHEELER, CAR/LMV, TRUCK, BUS/COMM)
    Active: #00C896 border + checkmark overlay
  Step 03: JURISDICTION — state dropdown + GPS icon
  Step 04: HISTORY — REPEAT OFFENDER toggle
AI TACTICAL INSIGHT card below steps
```

### Emergency (`/emergency`)
```
Terminal: "EMERGENCY PROTOCOL TERMINAL" + SENTINEL ACTIVE
Status chips: TACTICAL CENTER + SATELLITE LOCK
Hero: "PROTOCOL TERMINAL" 28px/700 compressed
Emergency SOS card (full-width): red gradient, shield icon, "EMERGENCY SOS",
  "LIVE GEOLOC SYNC ACTIVE" dot, "CALL 112 NOW →" button, "ARMED & READY" + "SECURE CONNECTION"
Filter tabs: MEDICAL, FIRE, ACCIDENT, CRIMINAL
Protocol items: expand/collapse, numbered steps, "DISPATCH 108" CTA
```

### Profile (`/profile`)
```
Terminal: "OPERATOR IDENTITY MATRIX" + SENTINEL ACTIVE
"PROFILE MATRIX SYNC" chip + "EDIT PROFILE" ghost button
Avatar (80px circle) + name (20px/600) + ID badge (mono) + SAFEVIXAI brand chip
Identity cards:
  - ACTIVE VESSEL — vehicle number
  - BIO SIGNATURE — blood group + EMERGENCY_BROADCAST_ON
  - EMERGENCY CONTACT — phone + SOS_DISPATCH_CONTACT

QR EMERGENCY CODE card (after identity cards):
  "EMERGENCY QR CODE" overline header (green)
  128×128 QR code (white on dark, generate from user profile data)
  Name + Blood group shown below QR
  "Scan in emergency — no app needed" caption
  "Download" + "Share" ghost buttons

MISSION PROTOCOL toggles:
  V8 OFFLINE MODE / CRASH DETECTION / PUSH HUB

TACTICAL AWARDS section (badges — must be dynamic not hardcoded)
```

### Settings (`/settings`)
```
Terminal: "SYSTEM SETTINGS" + SENTINEL ACTIVE
"IDENTITY MATRIX ACTIVE" / "AUTHENTICATED OPERATOR" chip (conditional)

Section 1 — OPERATOR IDENTITY:
  If authenticated: operator name card with JWT badge (green border, User icon)
  ProfileCard component: avatar + name + blood group + vehicle + phone (from store)

Section 2 — VISUAL INTERFACE:
  LIGHT / DARK / SYSTEM selector (3 cards, active = green border #1A5C38)

Section 3 — VIGILANCE PROTOCOLS:
  4 toggle rows with icons:
    - CRASH DETECTION (red shield icon) — bound to store.crashDetectionEnabled
    - SPEED WARNINGS (amber zap icon)
    - HAZARD ALERTS (blue bell icon) — push notifications
    - SOS VIBRATION (purple vibrate icon) — haptic feedback

Section 4 — LOCATION & PRIVACY:
  3 toggle rows:
    - LIVE LOCATION (green nav icon) — GPS tracking
    - AUTO-OFFLINE BUNDLE (emerald database icon) — cache on connectivity drop
    - USAGE ANALYTICS (slate map icon) — anonymous telemetry opt-in
  Privacy note: "SafeVixAI does not sell your data..." (10px slate)

Section 5 — STORAGE MATRIX:
  - OFFLINE CACHE: Database icon + PURGE red button (clears svai-offline-bundle)
  - EXPORT PROFILE: Download icon + EXPORT green button (JSON download, GDPR compliant)
  - Version: "SafeVixAI v2.4.0-SVA" + green checkmark

Section 6 — SYSTEM LINKS:
  - Edit Profile → /profile (chevron)
  - Emergency Protocols → /emergency (chevron)
  - Build Info: "IIT Madras Hackathon 2024" + version number

Section 7 — SIGN OUT (conditional, only when authenticated):
  Full-width red outlined button: "SIGN OUT OPERATOR — {name}"
  Clears auth from store → redirects to /login
```

### Login / Auth (`/login`)
```
Full-screen: bg #0A0E14, centered card 400px max-width
SafeVixAI logo + "SafeVixAI" wordmark (centered)
"OPERATOR AUTHENTICATION" overline
Email input → "REQUEST OTP" green button
6-digit OTP input (monospace) → "VERIFY & ENTER" green button
Divider line + "OR"
"CONTINUE AS GUEST" ghost button
"Your data stays on your device" privacy note (12px/#6B7A8D)
```

### Emergency Card (`/emergency-card/[userId]`)
```
Public page — no login required. Accessible via QR scan.
Full-screen: bg #0A0E14
SafeVixAI + "EMERGENCY CARD" overline
Name (large, 28px/700)
Blood group (hero, 48px/800 monospace, #FF6B6B)
Emergency contact (clickable tel: link, 20px/600)
Vehicle number (16px/600 monospace)
"CALL 112 EMERGENCY" red button (full-width)
Footer: "Powered by SafeVixAI — India Road Safety AI"
```

---

## 8. CSS Variables (full set)

```css
:root {
  --font-sans: 'Inter Variable', 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;

  --bg:          #0A0E14;
  --surface-1:   #111520;
  --surface-2:   #181D2A;
  --surface-3:   #1F2535;
  --surface-4:   #252B3A;

  --border:      rgba(255,255,255,0.07);
  --border-md:   rgba(255,255,255,0.12);
  --border-warm: #2A2E3A;
  --border-green: rgba(0,200,150,0.30);
  --border-red:   rgba(220,38,38,0.40);

  --brand:       #1A5C38;
  --brand-light: #00C896;
  --brand-dim:   rgba(26,92,56,0.12);

  --emergency:   #DC2626;
  --emergency-dim: rgba(220,38,38,0.15);

  --challan-amount: #00E676;

  --text-1:  #F0F4F8;
  --text-2:  #A8B4C4;
  --text-3:  #6B7A8D;
  --text-green: #00C896;
  --text-red:   #FF6B6B;
  --text-amber: #F59E0B;

  --r-sm:   4px;
  --r-md:   6px;
  --r-lg:   8px;
  --r-xl:   12px;
  --r-hero: 16px;
  --r-pill: 9999px;
}

[data-theme="light"] {
  --bg:         #F0F2F5;
  --surface-1:  #FFFFFF;
  --surface-2:  #F7F9FC;
  --border:     #E2E6ED;
  --border-md:  #CDD3DC;
  --text-1:     #0F1A2E;
  --text-2:     #4A5568;
  --text-3:     #8A95A3;
}
```

---

## 9. Responsive

| Width | Layout |
|---|---|
| < 768px | No sidebar. Bottom nav 64px. SOS float bottom-right. Full-width cards. |
| 768–1024px | Sidebar icons-only 48px. No bottom nav. |
| > 1024px | Full sidebar 192px. No bottom nav. Emergency dial pinned. |

Map: `height: calc(100vh - 52px)` desktop. `height: calc(100vh - 52px - 64px)` mobile.
Chat: `height: calc(100dvh - 52px - 64px)` mobile to fix blank screen bug.

---

## 10. Do Not Change

These are already enterprise-grade — leave them:
- Emergency SOS red gradient card on `/emergency` ✅
- Challan ₹ amount green monospace display ✅
- Sidebar with emergency dial numbers pinned at bottom ✅
- Floating red SOS button placement (bottom-right mobile) ✅
- Filter chip row on Map and Locator ✅
- Vehicle selector card grid (Challan) with green active state ✅
- DARK/LIGHT/SYSTEM theme selector in Settings ✅
- Bottom nav 5 tabs ✅

---

## 11. Bugs — Status

1. ~~`/assistant` blank on mobile~~ — **FIXED** ✅ (min-h-0 flex constraint + calc height)
2. "NORMAL MODE" badge on First Aid — move to header bar (low priority)
3. ~~Chat bubble z-index issue on `/assistant`~~ — **FIXED** ✅ (proper z-layering)
4. ~~Settings identity card must bind to `useAppStore().userProfile.name`~~ — **FIXED** ✅ (ProfileCard component)
5. ~~Global blue token migration~~ — **FIXED** ✅ (zero blue-500/600/400 remaining)
6. ~~SafeVision AI branding remnants~~ — **FIXED** ✅ (zero matches remaining)
7. ~~CSS variables referencing legacy blues (#4b8eff, #adc6ff)~~ — **FIXED** ✅ (migrated to #00C896)

---

## 12. Naming Conventions

| Context | Correct | Wrong |
|---|---|---|
| App name (UI display) | SafeVixAI | RoadSoS, SafeVisionAI, Safevixai |
| AI assistant label | SafeVixAI | SafeVision AI (with space) |
| Brand ID badge | SVA-XXXX-X | SVA2024-X |
| Emergency number header | "SAFEVIXAI SENTINEL" | "ROADOS SENTINEL" |
