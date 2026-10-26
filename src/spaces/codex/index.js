// Espace provisoire.
import { footer } from '../../ui/dom.js';
export function mount(root, route, { chrome, setMeta, world }) {
  setMeta('codex');
  chrome.setBar({ title: 'codex' });
  world?.setMode('ambient');
  root.innerHTML = `<section class="page"><h1>codex</h1>${footer()}</section>`;
  return {};
}
