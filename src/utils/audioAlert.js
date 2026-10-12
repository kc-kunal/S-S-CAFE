/**
 * 🔊 Meesho / Soundbox-Style Order Alert & Voice Notification Engine
 * - Signature Upbeat Merchant Chime via Web Audio API (Zero audio files, 100% offline, works across all devices)
 * - Clear Hindi / English Voice Speech via Web Speech API: "Dine-in ka order aaya hai, check karein"
 * - Dynamic Table announcement: "Dine-in ka order aaya hai, Table number [X], check karein"
 */

const STORAGE_KEY = 'cafe_dinein_alert_settings';

// Default configuration
const DEFAULT_SETTINGS = {
  enabled: true,          // Overall sound ON/OFF
  voiceEnabled: true,     // Spoken voice announcement ON/OFF ("Dine in ka order aaya hai check kare")
  soundType: 'meesho',    // 'meesho' | 'classic'
  announceTable: true,    // Speak "Table number X"
  rate: 0.95,             // Cadence (0.95 is natural and clear)
  pitch: 1.05,            // Bright and audible alert pitch
  volume: 1.0
};

// Retrieve persisted settings
export function getDineInAlertSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not read alert settings:', err);
  }
  return DEFAULT_SETTINGS;
}

// Save alert settings
export function saveDineInAlertSettings(settings) {
  if (typeof window === 'undefined') return;
  try {
    const current = getDineInAlertSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('Could not save alert settings:', err);
  }
}

// Cached voices for instant availability
let cachedVoices = [];
function updateVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }

  // Pre-unlock audio & speech context on first user touch/click (resolves mobile/desktop browser autoplay restrictions)
  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const dummy = new AudioCtx();
        if (dummy.state === 'suspended') {
          dummy.resume().then(() => dummy.close()).catch(() => {});
        } else {
          dummy.close().catch(() => {});
        }
      }
      updateVoices();
    } catch (e) {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
}

/**
 * Synthesizes the signature upbeat Meesho merchant order alert chime
 * (C5 -> E5 -> G5 -> High C6 ascending fanfare chime with sparkling harmonic overtones)
 */
export function playMeeshoChime(customCtx = null) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = customCtx || new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    // Upbeat 4-note ascending fanfare chime (C5, E5, G5, High C6 ring)
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.12, gain: 0.35 }, // C5
      { freq: 659.25, start: 0.11, dur: 0.12, gain: 0.40 }, // E5
      { freq: 783.99, start: 0.22, dur: 0.14, gain: 0.45 }, // G5
      { freq: 1046.50, start: 0.35, dur: 0.55, gain: 0.60 } // C6 (long ring)
    ];

    notes.forEach(({ freq, start, dur, gain: maxGain }) => {
      const noteStart = t + start;
      const noteEnd = noteStart + dur;

      // Primary tone (warm sine wave)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.linearRampToValueAtTime(maxGain, noteStart + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd);

      // Harmonic sparkle overtone (adds crisp electronic bell character like Soundbox / Meesho)
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, noteStart);

      overtoneGain.gain.setValueAtTime(0.0001, noteStart);
      overtoneGain.gain.linearRampToValueAtTime(maxGain * 0.25, noteStart + 0.01);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + dur * 0.6);

      overtone.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      overtone.start(noteStart);
      overtone.stop(noteStart + dur * 0.6);
    });
  } catch (err) {
    console.warn('Meesho chime playback error:', err);
  }
}

/**
 * Classic 3-tone cafe chime bell (D5 -> A5 -> D6)
 */
export function playClassicChime(customCtx = null) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = customCtx || new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    const notes = [
      { freq: 587.33, start: 0, duration: 0.18, gain: 0.25 },
      { freq: 880.00, start: 0.16, duration: 0.22, gain: 0.35 },
      { freq: 1174.66, start: 0.34, duration: 0.55, gain: 0.45 }
    ];

    notes.forEach(({ freq, start, duration, gain: maxGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + start);

      gain.gain.setValueAtTime(0.001, t + start);
      gain.gain.linearRampToValueAtTime(maxGain, t + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + start);
      osc.stop(t + start + duration);
    });
  } catch (err) {
    console.warn('Classic chime playback error:', err);
  }
}

/**
 * Find the most suitable voice on the user's device (Hindi preferred, Indian English fallback)
 */
function pickBestSpeechVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = (cachedVoices && cachedVoices.length) ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;

  // 1. Check for genuine Hindi voice (e.g. Google हिन्दी, Microsoft Swara, Microsoft Hemant, hi-IN)
  const hindi = voices.find(v => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return l.startsWith('hi') || l === 'hi-in' || n.includes('hindi') || n.includes('swara') || n.includes('hemant');
  });
  if (hindi) return { voice: hindi, isHindi: true };

  // 2. Check for Indian English voice (e.g. en-IN, Google Indian English, Heera, Ravi, Neerja)
  const indianEng = voices.find(v => {
    const l = (v.lang || '').toLowerCase();
    return l === 'en-in' || l.includes('en_in');
  });
  if (indianEng) return { voice: indianEng, isHindi: false, isIndian: true };

  // 3. Fallback to default or any English voice
  const def = voices.find(v => v.default) || voices.find(v => (v.lang || '').startsWith('en')) || voices[0];
  return { voice: def, isHindi: false, isIndian: false };
}

/**
 * Speaks the alert message clearly via Web Speech API
 */
export function speakOrderVoice({
  tableNumber = '',
  totalAmount = '',
  force = false,
  customText = ''
} = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const settings = getDineInAlertSettings();
  if (!force && (!settings.enabled || !settings.voiceEnabled)) return;

  try {
    // Clear any stuck utterance in browser speech queue
    window.speechSynthesis.cancel();

    const voiceInfo = pickBestSpeechVoice();
    const isHindiVoice = voiceInfo?.isHindi;

    let phrase = '';

    if (customText) {
      phrase = customText;
    } else if (isHindiVoice) {
      // Natural Devanagari Hindi text for Hindi TTS
      if (tableNumber && settings.announceTable) {
        phrase = `डाइन इन का ऑर्डर आया है, टेबल नंबर ${tableNumber}, चेक करें.`;
      } else {
        phrase = `डाइन इन का ऑर्डर आया है, चेक करें.`;
      }
    } else {
      // High-compatibility Latin phonetic text that sounds clear and natural across both Indian and standard voices
      if (tableNumber && settings.announceTable) {
        phrase = `Dine-in ka order aaya hai. Table number ${tableNumber}. Check karein.`;
      } else {
        phrase = `Dine-in ka order aaya hai, check karein.`;
      }
    }

    const utterance = new SpeechSynthesisUtterance(phrase);

    if (voiceInfo?.voice) {
      utterance.voice = voiceInfo.voice;
      utterance.lang = voiceInfo.voice.lang || (isHindiVoice ? 'hi-IN' : 'en-IN');
    } else {
      utterance.lang = 'hi-IN';
    }

    utterance.rate = settings.rate || 0.95;
    utterance.pitch = settings.pitch || 1.05;
    utterance.volume = settings.volume || 1.0;

    // Small delay to ensure cancel completed cleanly before dispatching new speech
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak error:', err);
      }
    }, 20);
  } catch (err) {
    console.warn('Speech alert error:', err);
  }
}

/**
 * 🌟 Complete Meesho-style Alert: Chime Tone + Hindi Voice Announcement
 * Plays the upbeat chime first, followed seamlessly by:
 * "Dine-in ka order aaya hai, check karein"
 */
export function playDineInOrderAlert(options = {}) {
  const {
    tableNumber = '',
    totalAmount = '',
    force = false,
    customText = ''
  } = options;

  const settings = getDineInAlertSettings();
  if (!force && !settings.enabled) return;

  // 1. Play Tone (Meesho or Classic based on setting)
  if (settings.soundType === 'classic') {
    playClassicChime();
  } else {
    playMeeshoChime();
  }

  // 2. Speak announcement right as chime note rings (~420ms delay)
  if (force || settings.voiceEnabled) {
    setTimeout(() => {
      speakOrderVoice({
        tableNumber,
        totalAmount,
        force,
        customText
      });
    }, 420);
  }
}

/**
 * Backwards compatible export used throughout the app
 * Accepts options object or can be invoked with zero args
 */
export function playOrderChime(options = {}) {
  if (typeof options === 'object') {
    playDineInOrderAlert(options);
  } else {
    playDineInOrderAlert();
  }
}

/**
 * Interactive test function for UI test buttons
 */
export function testDineInAlert(tableNumber = '1') {
  playDineInOrderAlert({
    tableNumber,
    force: true
  });
}
