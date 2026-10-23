// Sources générales et notes, reprises de l’ancien site (bloc « Sources & images »). Maintenu à la main.
export const GENERAL_SOURCES = {
  univers: [
    {
      label: 'Game of Thrones — HBO',
      url: 'https://www.hbo.com/game-of-thrones',
    },
    {
      label: 'Westeros.org — The Citadel',
      url: 'https://www.westeros.org/Citadel/Concordance/',
    },
    {
      label: 'A Wiki of Ice and Fire',
      url: 'https://awoiaf.westeros.org/',
    },
    {
      label: 'Wiki of Westeros — adaptation télévisée',
      url: 'https://gameofthrones.fandom.com/wiki/Game_of_Thrones',
    },
    {
      label: 'Quartermaester — repères cartographiques',
      url: 'https://quartermaester.info/',
    },
  ],
  langues: [
    {
      label: 'David J. Peterson — Dothraki',
      url: 'https://dothraki.com/',
    },
    {
      label: 'Documents de dialogue — saisons 3 à 8',
      url: 'https://dedalvs.com/work/game-of-thrones/game_of_thrones_master_dialogue.pdf',
    },
    {
      label: 'Communauté Dothraki & Valyrian',
      url: 'https://dothraki.org/',
    },
  ],
};

export const NOTES = {
  langues:
    'Les formules sont transcrites en alphabet latin. Les langues peu documentées sont présentées sans lexique inventé.',
  images: [
    'Illustrations d’ambiance et portraits : interprétations créées pour ce guide. Les images de territoires accompagnant les fiches peuvent évoquer un contexte plutôt que représenter exactement le lieu nommé.',
    'Les images d’armoiries sont reproduites depuis A Wiki of Ice and Fire ; les crédits, auteurs et licences sont détaillés ci-dessous.',
  ],
  perimetre:
    'Ce guide privilégie la série Game of Thrones et signale les différences importantes avec les romans. Il se concentre sur les cultures et institutions abordées dans le récit, sans prétendre recenser chaque nom de l’univers.',
};

export const DISCLAIMER =
  'Guide de fan non officiel, sans affiliation avec HBO ni George R. R. Martin.';

/** Crédits des armoiries SVG (public/sigils/credits-svg.json), sans les entrées en erreur. */
export async function loadSigilCredits() {
  const res = await fetch(new URL('sigils/credits-svg.json', document.baseURI));
  const list = await res.json();
  return list.filter((c) => !c.error);
}
