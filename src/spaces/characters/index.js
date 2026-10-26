// Espace provisoire.
import { footer } from '../../ui/dom.js';
export function mount(root, route, { chrome, setMeta, world }) {
  setMeta('characters');
  chrome.setBar({ title: 'characters' });
  world?.setMode('ambient');
  root.innerHTML = `<section class="page"><h1>characters</h1>${footer()}</section>`;
  return {};
}
