// Son d'ambiance : un drone grave généré en WebAudio (aucun fichier audio), désactivé par
// défaut, coupé quand l'onglet est caché (PROJET.md §8.4, §9).

let ctx = null;
let master = null;
let enabled = false;

function build() {
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  // Filtre passe-bas qui « respire » lentement.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  filter.Q.value = 0.7;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  // Trois voix graves légèrement désaccordées (la, mi, la).
  for (const [freq, type, level] of [
    [55, 'sawtooth', 0.32],
    [82.6, 'triangle', 0.4],
    [110.4, 'sine', 0.22],
  ]) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = level;
    osc.connect(g).connect(filter);
    osc.start();
  }
  filter.connect(master).connect(ctx.destination);
}

function setEnabled(on, buttons) {
  enabled = on;
  if (on && !ctx) build();
  if (ctx) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(on ? 0.05 : 0, t, 0.6);
    if (on) ctx.resume();
  }
  for (const b of buttons) {
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Couper le son d’ambiance' : 'Activer le son d’ambiance');
  }
}

export function initAudio() {
  const buttons = [...document.querySelectorAll('.hud-sound')];
  buttons.forEach((b) => b.addEventListener('click', () => setEnabled(!enabled, buttons)));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });
}
