// Son d'ambiance (§8.4) : entièrement généré en WebAudio, aucun fichier sous licence.
// Coupé par défaut. Sa couleur change selon la zone : vent au nord, ressac aux Îles de Fer,
// rumeur de ville à Port-Réal, grondement à Valyria, nappe grave ailleurs.

let ctx = null;
let master = null;
const layers = {};
let zone = 'nappe';
let enabled = false;

/** Bruit blanc en boucle (2 s). */
function noiseSource() {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start();
  return src;
}

/** Modulation lente d'un paramètre (LFO). */
function lfo(param, freq, depth) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  g.gain.value = depth;
  o.connect(g).connect(param);
  o.start();
}

function layer(name, build) {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  build(gain);
  gain.connect(master);
  layers[name] = gain;
}

function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Nappe : trois voix graves désaccordées sous un passe-bas qui respire.
  layer('nappe', (out) => {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 320;
    lfo(f.frequency, 0.05, 140);
    for (const [freq, type, level] of [
      [55, 'sawtooth', 0.3],
      [82.6, 'triangle', 0.4],
      [110.4, 'sine', 0.2],
    ]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = level;
      o.connect(g).connect(f);
      o.start();
    }
    f.connect(out);
  });
  // Vent : bruit en passe-bande dont la fréquence et le volume errent lentement.
  layer('vent', (out) => {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 600;
    f.Q.value = 0.8;
    lfo(f.frequency, 0.08, 380);
    const g = ctx.createGain();
    g.gain.value = 0.6;
    lfo(g.gain, 0.13, 0.35);
    noiseSource().connect(f).connect(g).connect(out);
  });
  // Ressac : bruit grave, volume en vagues de ~7 s.
  layer('ressac', (out) => {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    lfo(g.gain, 0.14, 0.45);
    noiseSource().connect(f).connect(g).connect(out);
  });
  // Rumeur de ville : bruit étroit dans les médiums, légèrement agité.
  layer('ville', (out) => {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 420;
    f.Q.value = 2.2;
    lfo(f.frequency, 0.6, 60);
    const g = ctx.createGain();
    g.gain.value = 0.7;
    noiseSource().connect(f).connect(g).connect(out);
  });
  // Grondement : sinusoïde très grave et bruit étouffé.
  layer('grondement', (out) => {
    const o = ctx.createOscillator();
    o.frequency.value = 36;
    const og = ctx.createGain();
    og.gain.value = 0.6;
    lfo(og.gain, 0.09, 0.3);
    o.connect(og).connect(out);
    o.start();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 140;
    noiseSource().connect(f).connect(out);
  });
}

function mix() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const [name, g] of Object.entries(layers)) {
    const on = name === zone || (name === 'nappe' && zone !== 'grondement');
    g.gain.setTargetAtTime(on ? (name === 'nappe' ? 0.5 : 1) : 0, t, 1.2);
  }
}

export const audio = {
  get enabled() {
    return enabled;
  },
  setEnabled(on) {
    enabled = on;
    if (on && !ctx) build();
    if (!ctx) return;
    master.gain.setTargetAtTime(on ? 0.05 : 0, ctx.currentTime, 0.6);
    if (on) ctx.resume();
    mix();
  },
  /** Zone sonore : 'nappe' | 'vent' | 'ressac' | 'ville' | 'grondement'. */
  setZone(z) {
    if (z === zone) return;
    zone = z;
    mix();
  },
};

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend();
  else if (enabled) ctx.resume();
});
