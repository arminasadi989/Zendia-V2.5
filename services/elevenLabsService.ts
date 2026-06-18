// --- ElevenLabs TTS Integration ---
// Provides an alternative Text-to-Speech engine to Gemini TTS.
// Mirrors the same streaming-chunk interface (onChunk receives raw PCM Uint8Array, 24kHz 16-bit mono)
// so the playback code in TextToSpeech.tsx can treat both providers identically.

export type TtsProvider = 'gemini' | 'elevenlabs';

const LS_PROVIDER_KEY = 'zendia_tts_provider';
const LS_ELEVENLABS_API_KEY = 'zendia_elevenlabs_api_key';
const LS_ELEVENLABS_VOICE_ID = 'zendia_elevenlabs_voice_id';

// "Rachel" - a standard ElevenLabs premade multilingual-capable voice available to every account.
const DEFAULT_ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

// --- TTS Provider selection (persisted) ---
export const getTtsProvider = (): TtsProvider => {
  if (typeof window === 'undefined') return 'elevenlabs';
  const stored = window.localStorage.getItem(LS_PROVIDER_KEY);
  return stored === 'gemini' ? 'gemini' : 'elevenlabs'; // default: ElevenLabs
};

export const setTtsProvider = (provider: TtsProvider) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LS_PROVIDER_KEY, provider);
  }
};

// --- ElevenLabs API key (persisted) ---
export const getElevenLabsApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LS_ELEVENLABS_API_KEY);
};

export const setElevenLabsApiKey = (key: string | null) => {
  if (typeof window === 'undefined') return;
  if (key) window.localStorage.setItem(LS_ELEVENLABS_API_KEY, key);
  else window.localStorage.removeItem(LS_ELEVENLABS_API_KEY);
};

// --- ElevenLabs Voice ID (persisted, optional override) ---
export const getElevenLabsVoiceId = (): string => {
  if (typeof window === 'undefined') return DEFAULT_ELEVENLABS_VOICE_ID;
  return window.localStorage.getItem(LS_ELEVENLABS_VOICE_ID) || DEFAULT_ELEVENLABS_VOICE_ID;
};

export const setElevenLabsVoiceId = (voiceId: string | null) => {
  if (typeof window === 'undefined') return;
  if (voiceId && voiceId.trim()) window.localStorage.setItem(LS_ELEVENLABS_VOICE_ID, voiceId.trim());
  else window.localStorage.removeItem(LS_ELEVENLABS_VOICE_ID);
};

// --- Streaming speech generation ---
// Calls ElevenLabs' streaming endpoint with output_format=pcm_24000 so the raw bytes are
// already in the exact same format (16-bit PCM, 24kHz, mono) the app's WAV/playback utils expect.
export const generateElevenLabsSpeechStream = async (
  text: string,
  onChunk: (pcmBytes: Uint8Array) => void,
  voiceId?: string
): Promise<void> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY_MISSING');
  }

  const resolvedVoiceId = voiceId || getElevenLabsVoiceId();

  // Routed through our own same-origin Vercel function (api/elevenlabs-tts.ts) instead of
  // calling api.elevenlabs.io directly from the browser, since ElevenLabs' own docs note
  // that direct frontend calls can trigger a CORS error.
  const response = await fetch('/api/elevenlabs-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, apiKey, voiceId: resolvedVoiceId }),
  });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch { /* ignore */ }
    const err: any = new Error(`ElevenLabs API error (${response.status}): ${detail || response.statusText}`);
    err.status = response.status;
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ElevenLabs: no readable response stream received.');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.length > 0) onChunk(value);
  }
};
