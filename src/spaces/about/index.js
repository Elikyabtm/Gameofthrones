// À propos (§4.2) : intention du guide, anti-spoilers, sources, crédits et avertissement.
import credits from '../../data/sigil-credits.json';
import { esc, footer } from '../../ui/dom.js';

const SOURCES = [
  {
    label: 'Wiki of Westeros (adaptation télévisée)',
    url: 'https://gameofthrones.fandom.com/wiki/Game_of_Thrones',
  },
  { label: 'A Wiki of Ice and Fire', url: 'https://awoiaf.westeros.org/' },
  { label: 'Westeros.org — The Citadel', url: 'https://www.westeros.org/Citadel/Concordance/' },
  { label: 'Quartermaester — repères cartographiques', url: 'https://quartermaester.info/' },
  {
    label: 'David J. Peterson — langues construites (dothraki, valyrien)',
    url: 'https://dedalvs.com/',
  },
];

export function mount(root, route, ctx) {
  ctx.setMeta(
    'À propos',
    'Guide de fan non officiel : intention, sources, crédits et avertissement.',
  );
  ctx.chrome.setBar({ title: 'À propos' });
  ctx.world?.setMode('ambient', { place: { x: 600, y: 650 } });
  root.innerHTML = `
  <article class="page about" aria-labelledby="about-title">
    <header class="page-head">
      <p class="label label-accent">À propos</p>
      <h1 id="about-title">Un monde à explorer</h1>
      <p class="page-lead">A Realm Divided est un guide de fan, écrit en français, pour parcourir l’univers de la série Game of Thrones comme un territoire : une carte d’abord, puis les gens qui l’habitent, leurs maisons et leurs croyances.</p>
    </header>
    <div class="about-columns">
      <section>
        <h2 class="section-title">Sans spoilers</h2>
        <p>Le guide vous demande jusqu’où vous avez regardé la série. Tout ce qui se passe après la saison choisie est retiré de la page avant même d’être affiché : biographies, relations, statuts, alias et filiations secrètes. Vous pouvez changer de saison à tout moment, en haut de l’écran ou dans le menu.</p>
        <h2 class="section-title">Textes</h2>
        <p>Les textes sont rédigés pour ce guide, avec nos propres mots. Les faits et les noms propres viennent de la série, dans leur graphie française ; les répliques citées sont brèves et attribuées. Les points dont nous ne sommes pas certains sont signalés dans nos notes de travail et vérifiés au fil des mises à jour.</p>
        <h2 class="section-title">Images</h2>
        <p>Les illustrations et portraits sont des images générées pour ce guide, dans un style commun. Aucune photo de la série ni d’acteur n’est utilisée. Tant qu’une image manque, un emplacement dessiné la remplace.</p>
        <p>La carte en relief est entièrement générée par le navigateur à partir de nos propres tracés : aucune carte officielle ni carte de fan n’a été reprise.</p>
      </section>
      <section>
        <h2 class="section-title">Sources</h2>
        <p>Ces références servent à vérifier les faits, pas à recopier :</p>
        <ul class="about-list">${SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ul>
        <h2 class="section-title">Crédits</h2>
        <h3 class="label">Armoiries</h3>
        <ul class="about-list">${credits
          .filter((c) => !c.error)
          .map(
            (c) =>
              `<li>Maison ${esc(c.house)} — ${esc(c.author)}, licence ${esc(c.license)} · <a href="${esc(c.page)}" target="_blank" rel="noopener noreferrer">source</a></li>`,
          )
          .join(
            '',
          )}<li>Maisons Frey, Mormont, Tarly, Reed, Clegane, Torth et Mervault : blasons simplifiés dessinés pour ce guide.</li></ul>
        <h3 class="label">Polices</h3>
        <ul class="about-list"><li>Cormorant Garamond (Christian Thalmann) et Manrope (Mikhail Sharanda), sous licence SIL Open Font License, hébergées avec le site.</li></ul>
        <h3 class="label">Technique</h3>
        <ul class="about-list"><li>Three.js (licence MIT) pour la carte en relief, Vite pour la construction du site. Sons d’ambiance synthétisés dans le navigateur.</li></ul>
      </section>
    </div>
    <section class="disclaimer">
      <h2 class="section-title">Avertissement</h2>
      <p>Guide de fan non officiel, sans affiliation avec HBO ni George R. R. Martin. Game of Thrones et les noms associés appartiennent à leurs ayants droit ; ce site n’a aucun but commercial.</p>
    </section>
    ${footer()}
  </article>`;
  return {};
}
