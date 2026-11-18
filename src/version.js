/** Build id of the published game (the commit SHA, stamped by scripts/build.mjs); "__BUILD__" while developing. */
export const VERSION = '__BUILD__';

export const versionLabel = () => (VERSION.startsWith('__') ? 'dev' : VERSION.slice(0, 7));
