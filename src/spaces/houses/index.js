// Espace provisoire.
import { footer } from '../../ui/dom.js';
export function mount(root, route, { chrome, setMeta, world }) {
  setMeta('houses');
  chrome.setBar({ title: 'houses' });
  world?.setMode('ambient');
  root.innerHTML = `<section class="page"><h1>houses</h1>${footer()}</section>`;
  return {};
}
