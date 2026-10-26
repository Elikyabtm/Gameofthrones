// Espace provisoire.
import { footer } from '../../ui/dom.js';
export function mount(root, route, { chrome, setMeta, world }) {
  setMeta('about');
  chrome.setBar({ title: 'about' });
  world?.setMode('ambient');
  root.innerHTML = `<section class="page"><h1>about</h1>${footer()}</section>`;
  return {};
}
