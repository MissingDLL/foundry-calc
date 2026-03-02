// ============================================================
// data/version-registry.js
// ============================================================
// Liste aller verfügbaren Spielversionen.
// Neue Spielversion: neues Verzeichnis unter data/versions/ anlegen,
// dann hier einen Eintrag hinzufügen.
const GAME_VERSIONS = Object.freeze([
  { id: 'v0.6.0.24342', label: 'Early Access (v0.6.0.24342)' },
  { id: 'test', label: 'Test (veränderte Rezepte)' },
]);
const GAME_VERSION_DEFAULT = 'v0.6.0.24342';
