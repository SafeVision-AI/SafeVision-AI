/**
 * offline-ai.ts — Gemma 4 E2B Offline AI Engine
 *
 * Strategy (in order of preference):
 *  1. Chrome Built-in AI (window.ai) — uses Android AICore / Chrome AI, ZERO download
 *  2. Transformers.js + WebGPU — downloads Gemma 4 E2B (~1.3GB), cached in browser
 *  3. Keyword fallback — deterministic responses using cached offline data
 *
 * Model: google/gemma-4-E2B-it
 *  - 1.3GB download (once, cached via Service Worker)
 *  - 140 languages natively (Hindi, Tamil, Telugu, Kannada, Malayalam, etc.)
 *  - Native audio input — no separate ASR step needed
 *  - Apache 2.0 license — free for commercial use
 *  - On Android 10+ with Google Play Services → pre-installed via AICore (0MB)
 */

'use client';

// ── Types ─────────────────────────────────────────────────────────────────

export type OfflineAIStatus =
  | 'idle'
  | 'checking_system'
  | 'system_available'     // Chrome AI / Android AICore — 0MB download
  | 'downloading'          // Transformers.js download in progress
  | 'ready'                // Model loaded and ready
  | 'error';

export interface OfflineAIProgress {
  status: OfflineAIStatus;
  percent: number;         // 0–100
  bytesLoaded?: number;
  bytesTotal?: number;
  message: string;
}

export type ProgressCallback = (progress: OfflineAIProgress) => void;

// ── Internal state ────────────────────────────────────────────────────────

let _pipeline: any = null;
let _systemSession: any = null;  // Chrome Built-in AI session
let _status: OfflineAIStatus = 'idle';

// ── System AI check (Chrome / Android AICore) ─────────────────────────────

async function checkSystemAI(): Promise<boolean> {
  try {
    const win = window as any;
    // Chrome 127+ Built-in AI API (uses Gemma system-wide)
    if (win.ai?.languageModel) {
      const caps = await win.ai.languageModel.capabilities();
      if (caps?.available === 'readily') {
        _systemSession = await win.ai.languageModel.create({
          systemPrompt:
            'You are SafeVixAI, an emergency road safety AI. ' +
            'Answer concisely in the same language the user writes in. ' +
            'Prioritize safety, first aid, and emergency contacts.',
        });
        return true;
      }
    }
  } catch (_) {
    // Chrome AI not available — fall through to Transformers.js
  }
  return false;
}

// ── Transformers.js Gemma 4 E2B loader ───────────────────────────────────

async function loadTransformersGemma(
  onProgress?: ProgressCallback,
): Promise<void> {
  // Dynamic import so the Transformers.js bundle is only loaded when needed
  const { pipeline, env } = await import('@huggingface/transformers');

  // Store model in browser Cache Storage (survives page refresh)
  env.useBrowserCache = true;
  env.allowLocalModels = false;

  onProgress?.({
    status: 'downloading',
    percent: 0,
    message: 'Starting Gemma 4 download… (1.3GB — cached on WiFi)',
  });

  _pipeline = await pipeline(
    'text-generation',
    'google/gemma-4-E2B-it',
    {
      device: 'webgpu',   // GPU acceleration — falls back to WASM automatically
      dtype: 'q4',        // 4-bit quantized — fits in ~1.3GB
      progress_callback: (p: any) => {
        const pct = Math.round((p.progress || 0) * 100);
        const loaded = p.loaded || 0;
        const total = p.total || 0;
        onProgress?.({
          status: 'downloading',
          percent: pct,
          bytesLoaded: loaded,
          bytesTotal: total,
          message:
            total > 0
              ? `Loading Gemma 4… ${(loaded / 1e6).toFixed(0)}MB / ${(total / 1e6).toFixed(0)}MB`
              : `Loading Gemma 4… ${pct}%`,
        });
      },
    },
  );
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * getOfflineAI — Initialize offline AI (call once on user confirmation).
 *
 * Flow:
 *   1. Check window.ai (Chrome / Android AICore) → 0MB, instant
 *   2. If unavailable → download Gemma 4 E2B via Transformers.js (~1.3GB)
 *
 * IMPORTANT: Never auto-call this. Always wait for user to tap
 * "Enable Offline AI" — downloading 1.3GB without consent is bad UX.
 */
export async function getOfflineAI(
  onProgress?: ProgressCallback,
): Promise<{ type: 'system' | 'transformers' | 'fallback' }> {
  if (_status === 'ready') {
    return { type: _systemSession ? 'system' : 'transformers' };
  }

  _status = 'checking_system';
  onProgress?.({ status: 'checking_system', percent: 0, message: 'Checking for system AI…' });

  // Try Chrome Built-in AI first (0MB download, instant)
  const hasSystem = await checkSystemAI();
  if (hasSystem) {
    _status = 'ready';
    onProgress?.({ status: 'system_available', percent: 100, message: 'System AI ready (0MB download!)' });
    return { type: 'system' };
  }

  // Fall back to Transformers.js Gemma 4 download
  try {
    await loadTransformersGemma(onProgress);
    _status = 'ready';
    onProgress?.({ status: 'ready', percent: 100, message: 'Gemma 4 ready — full offline AI active' });
    return { type: 'transformers' };
  } catch (err) {
    console.error('[offline-ai] Gemma 4 load failed:', err);
    _status = 'error';
    onProgress?.({ status: 'error', percent: 0, message: 'Offline AI unavailable — using cached answers' });
    return { type: 'fallback' };
  }
}

/**
 * askOfflineAI — generate a response using whichever offline engine is ready.
 * Falls back gracefully to keyword matching if model not loaded.
 */
export async function askOfflineAI(
  prompt: string,
  audioBlob?: Blob,
): Promise<string> {
  // ── Chrome Built-in AI ────────────────────────────────────────────────
  if (_systemSession) {
    try {
      const response = await _systemSession.prompt(prompt);
      return response;
    } catch (err) {
      console.warn('[offline-ai] system AI error, falling back:', err);
    }
  }

  // ── Transformers.js Gemma 4 ───────────────────────────────────────────
  if (_pipeline) {
    try {
      const messages = audioBlob
        ? [
            {
              role: 'user',
              content: [
                { type: 'audio', audio: audioBlob },
                { type: 'text', text: prompt },
              ],
            },
          ]
        : [
            {
              role: 'system',
              content:
                'You are SafeVixAI, an emergency road safety AI assistant. ' +
                'Always answer in the same language the user writes in. ' +
                'Be concise and prioritize safety information.',
            },
            { role: 'user', content: prompt },
          ];

      const result = await _pipeline(messages, { max_new_tokens: 300 });
      const output = result[0]?.generated_text;
      if (Array.isArray(output)) {
        return output.at(-1)?.content ?? 'No response generated.';
      }
      return String(output ?? 'No response generated.');
    } catch (err) {
      console.warn('[offline-ai] Transformers.js error:', err);
    }
  }

  // ── Keyword fallback (always works, no model needed) ──────────────────
  return keywordFallback(prompt);
}

/** Status check — useful for showing loading states in UI */
export function getOfflineAIStatus(): OfflineAIStatus {
  return _status;
}

/** Returns true if offline AI is fully ready to respond */
export function isOfflineAIReady(): boolean {
  return _status === 'ready' || _status === 'system_available';
}

// ── Keyword fallback ──────────────────────────────────────────────────────

const FALLBACK_RESPONSES: Record<string, string> = {
  hospital:
    'Open the Locator tab to find the nearest hospital from cached data. ' +
    'Call 112 (emergency) or 102 (ambulance) immediately.',
  ambulance: 'Call 102 for ambulance or 112 for general emergency. Both are toll-free.',
  police: 'Call 100 (police) or 112 (emergency). Use the SOS button for automatic location sharing.',
  fire: 'Call 101 (fire) or 112. Move away from the vehicle immediately.',
  accident:
    'Section 134 MV Act: Duty to stop and render aid. Call 112. Do not move injured person unless in immediate danger. ' +
    'Apply pressure to bleeding wounds. Keep injured person warm and still.',
  pothole: 'Report via RoadWatch tab. Takes a photo — YOLOv8 AI will auto-detect it. Routes to correct authority (NHAI/PWD).',
  challan:
    'Open Challan Calculator. Select violation type and vehicle class. ' +
    'Fines are cached offline from the MV Amendment Act 2019.',
  helmet: 'Section 129/194D: No helmet fine ₹1,000. Repeated offence: licence suspension.',
  seatbelt: 'Section 194B: No seatbelt fine ₹1,000.',
  drunk: 'Section 185: Drunk driving fine ₹10,000 (first offence) or ₹15,000 + imprisonment.',
  speed: 'Section 183: Speeding fine ₹1,000–₹4,000 depending on vehicle type and excess speed.',
};

function keywordFallback(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lower.includes(keyword)) return response;
  }
  return (
    'I am in offline mode with limited knowledge. ' +
    'For emergencies: 112 (universal). 102 (ambulance). 100 (police). 101 (fire). ' +
    'Connect to the internet for full AI assistance.'
  );
}
