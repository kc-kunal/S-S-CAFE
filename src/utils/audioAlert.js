/**
 * Synthesizes a crisp, pleasant 3-tone cafe chime bell using Web Audio API
 * 100% client-side, zero external audio files needed, works offline!
 */
export function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Pleasant high-pitch bell sequence: D5 -> A5 -> D6
    const notes = [
      { freq: 587.33, start: 0, duration: 0.18, gain: 0.25 },
      { freq: 880.00, start: 0.16, duration: 0.22, gain: 0.35 },
      { freq: 1174.66, start: 0.34, duration: 0.55, gain: 0.45 }
    ];

    notes.forEach(({ freq, start, duration, gain: maxGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      // Bell envelope (quick attack, gradual natural ring decay)
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}
