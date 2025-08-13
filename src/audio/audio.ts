type ToneOpts = { freq: number; duration: number; type?: OscillatorType; gain?: number };

const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playTone({ freq, duration, type = 'sawtooth', gain = 0.02 }: ToneOpts) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(ctx.destination);
  osc.start();
  setTimeout(() => { osc.stop(); }, duration);
}

export function sfxSpinStart() { playTone({ freq: 220, duration: 120 }); }
export function sfxSpinStop() { playTone({ freq: 440, duration: 150, type: 'triangle' }); }
export function sfxWin() { playTone({ freq: 660, duration: 220, type: 'square', gain: 0.03 }); }
export function sfxBonus() { playTone({ freq: 880, duration: 300, type: 'sawtooth', gain: 0.03 }); }

let musicInterval: number | null = null;
export function startMusic(intense = false) {
  stopMusic();
  const base = intense ? 220 : 110;
  musicInterval = window.setInterval(() => {
    playTone({ freq: base, duration: 100, type: 'sine', gain: 0.01 });
    setTimeout(() => playTone({ freq: base*1.25, duration: 100, type: 'sine', gain: 0.008 }), 150);
    setTimeout(() => playTone({ freq: base*1.5, duration: 100, type: 'sine', gain: 0.008 }), 300);
  }, intense ? 1200 : 1800);
}
export function stopMusic() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }