// Corrections validées (réponse « fais tout » au rapport d'extraction de la phase 0).
// Appliquées par tools/extract-content.mjs APRÈS la reprise mot pour mot : l'extraction reste
// reproductible et chaque correction est lisible ici, avec l'ancien texte.
// Chaque entrée échoue bruyamment si le texte d'origine a changé.

const find = (list, id) => {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error(`Correction : fiche introuvable ${id}`);
  return item;
};

/** Remplace `from` par `to` dans une valeur ; lève une erreur si `from` est absent. */
const swap = (value, from, to, where) => {
  if (!value.includes(from)) throw new Error(`Correction : « ${from} » absent de ${where}`);
  return value.replace(from, to);
};

const setFact = (item, label, from, to) => {
  const fact = item.facts.find((f) => f.label === label);
  if (!fact) throw new Error(`Correction : fait « ${label} » absent de ${item.id}`);
  fact.value = swap(fact.value, from, to, `${item.id}.${label}`);
};

// Surtitres des langues : capitales de l'ancien site → casse normale (le CSS gère les capitales).
const LANG_KICKERS = {
  common: 'Westeros · Les échanges du monde connu',
  dothraki: 'Essos · La mer Dothrak',
  highvalyrian: 'Valyria · Héritage & savoir',
  lowvalyrian: 'Essos · Cités libres & baie des Serfs',
  old: 'Westeros · Premiers Hommes & Grand Nord',
  rhoynish: 'Essos · Rhoyne / héritage dornien',
  ghiscari: 'Essos · Ghis & sa mémoire',
  qartheen: 'Essos · Qarth',
  lhazareen: 'Essos · Lhazar',
};

export function applyCorrections({ groups, houses, languages, places, people }) {
  // 1. Un seul terme pour l'animal des Stark : « loup géant » (comme la fiche créature).
  setFact(find(houses, 'stark'), 'Armoiries', 'loup-garou', 'loup géant');

  // 2. Greyjoy : l'illustration du Mur est remplacée par celle des Fer-nés.
  find(houses, 'greyjoy').image = 'images/fer-nes.webp';

  // 3. Arbre : les mariages publics mais tardifs ne sont pas des filiations secrètes.
  for (const u of people.unions) {
    if (u.mode === 'secret' && u.children.length === 0) u.mode = 'spoiler';
  }

  // 4. Bio de Jon : retrait de la consigne d'interface de l'ancien site.
  const jon = find(people.people, 'jon');
  jon.bio = swap(
    jon.bio,
    ' Activez les révélations pour explorer sa filiation telle qu’elle est établie dans la série.',
    '',
    'jon.bio',
  );

  // 6. Fils de la Harpie : la valeur n'est pas une figure nommée.
  setFact(
    find(groups, 'harpy'),
    'Visages & repères',
    'Un réseau clandestin de Meereen',
    'Aucune figure nommée : des anonymes masqués',
  );

  // 7. Surtitres des langues en casse normale.
  for (const [id, kicker] of Object.entries(LANG_KICKERS)) find(languages, id).kicker = kicker;

  // 9. Une seule appellation pour la région de Castral Roc : « Les Terres de l’Ouest ».
  const castral = find(places, 'castral-roc');
  castral.kicker = swap(castral.kicker, 'L’Ouest', 'Les Terres de l’Ouest', 'castral-roc');
  setFact(castral, 'Région', 'L’Ouest', 'Les Terres de l’Ouest');

  // 10. « La Couronne » désigne l'institution : majuscule.
  const kg = find(groups, 'kingsguard');
  kg.kicker = swap(kg.kicker, 'La couronne', 'La Couronne', 'kingsguard');

  // 11. Langues des destinations d'Essos : majuscule initiale, comme dans les fiches de groupes.
  for (const p of places) {
    for (const f of p.facts) {
      if (f.label.startsWith('Langue')) f.value = f.value[0].toUpperCase() + f.value.slice(1);
    }
  }
}
