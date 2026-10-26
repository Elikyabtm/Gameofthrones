// Route inconnue (§4.2) : « Ce chemin n'existe pas sur nos cartes ».
import { footer, ornament } from '../ui/dom.js';

export function mount(root, route, { chrome, setMeta, world }) {
  setMeta('Chemin inconnu', 'Ce chemin n’existe pas sur nos cartes.');
  chrome.setBar({ title: 'Chemin inconnu' });
  world?.setMode('ambient');
  root.innerHTML = `
    <section class="page notfound">
      <div class="notfound-inner">
        ${ornament('fleuron', 'intro-fleuron')}
        <h1>Ce chemin n’existe pas sur nos cartes</h1>
        <p>Les cartographes n’ont rien noté à cet endroit. Peut-être une route effacée, ou une terre encore inexplorée.</p>
        <a class="btn btn-accent" href="/">Retour à la carte</a>
      </div>
      ${footer()}
    </section>`;
  return {};
}
