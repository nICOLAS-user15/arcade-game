/**
 * Tiny i18n layer. English is the source language; every other language must
 * provide exactly the same keys (enforced by test/i18n.test.js).
 *
 * Markup uses data-i18n (text), data-i18n-aria (aria-label) and data-i18n-title (title).
 */

export const DEFAULT_LANG = 'en';

export const LANGUAGES = Object.freeze({
  en: { label: 'English', locale: 'en-US', htmlLang: 'en' },
  pt: { label: 'Português', locale: 'pt-BR', htmlLang: 'pt-BR' }
});

export const DICT = {
  en: {
    'a11y.skip': 'Skip to menu',
    'a11y.board': 'Game board. {mode}, {name}.',

    'menu.tagline': '5 stages · 5 themes · endless glory',
    'menu.play': 'PLAY',
    'menu.mode': 'MODE',
    'menu.difficulty': 'DIFFICULTY',
    'menu.theme': 'THEME',

    'theme.classic': 'Classic',
    'theme.retro': 'Retro',
    'theme.modern': 'Modern',
    'theme.pastel': 'Pastel',
    'theme.minimal': 'Minimal',
    'theme.classic.hint': 'The arcade look: a blue maze on black.',
    'theme.retro.hint': 'Chunky 8-bit pixels and CRT scanlines.',
    'theme.modern.hint': 'Neon tubes glowing in the dark.',
    'theme.pastel.hint': 'Soft candy colors, easy on the eyes.',
    'theme.minimal.hint': 'Clean lines and neutral, futuristic tones.',
    'menu.howto': 'How to play',
    'menu.scores': 'High scores',
    'menu.settings': 'Settings',
    'menu.keys': 'Arrow keys / Tab to navigate · Enter to select',
    'menu.best': 'Best · {diff} · {mode}: {score}',

    'mode.campaign': 'Campaign',
    'mode.endless': 'Endless',
    'mode.campaign.hint': 'Clear all 5 stages to become an arcade champion.',
    'mode.endless.hint': 'The stages loop forever and ghosts get faster every lap.',

    'diff.easy': 'Easy',
    'diff.normal': 'Normal',
    'diff.hard': 'Hard',
    'diff.easy.hint': '{lives} lives · slower ghosts · longer power-ups',
    'diff.normal.hint': '{lives} lives · the classic challenge',
    'diff.hard.hint': '{lives} lives · faster ghosts · short power-ups',

    'hud.score': 'SCORE',
    'hud.best': 'BEST',
    'hud.lives': 'LIVES',
    'hud.stage': 'STAGE {n}/{max}',
    'hud.level': '∞ LEVEL {n}',

    'btn.pause': 'Pause',
    'btn.resume': 'Resume',
    'btn.sound': 'Sound on/off',
    'btn.fullscreen': 'Fullscreen',
    'btn.fullscreen.exit': 'Exit fullscreen',
    'btn.close': 'Close',
    'dpad.label': 'On-screen direction pad',
    'dir.up': 'Up',
    'dir.down': 'Down',
    'dir.left': 'Left',
    'dir.right': 'Right',

    'keys.move': 'Move',
    'keys.pause': 'Pause',
    'keys.fullscreen': 'Fullscreen',
    'keys.mute': 'Mute',

    'pause.title': 'PAUSED',
    'pause.resume': 'Resume',
    'pause.restart': 'Restart',
    'pause.quit': 'Quit to menu',

    'briefing.unlocked': '★ STAGE {n}/{max} UNLOCKED ★',
    'briefing.endless': '∞ ENDLESS · LEVEL {n}',
    'briefing.new': 'NEW',
    'briefing.fruit': 'BONUS FRUIT',
    'briefing.speed': 'GHOST SPEED',
    'briefing.speed.up': '+{n}% faster',
    'briefing.speed.base': 'Base speed',
    'briefing.bonus': 'Cutscene bonus',
    'briefing.enterStage': '▶ ENTER STAGE {n}',
    'briefing.enterLevel': '▶ ENTER LEVEL {n}',

    'result.gameover': 'GAME OVER',
    'result.gameover.text': 'Final score: {score} · {where}',
    'result.victory': 'ARCADE CHAMPION!',
    'result.victory.text': 'You cleared all {max} stages with {score} points!',
    'result.playAgain': '↻ PLAY AGAIN',
    'result.menu': '⌂ MENU',
    'result.endless': '♾ KEEP GOING (ENDLESS)',
    'result.newBest': '★ NEW PERSONAL BEST ★',
    'result.where.stage': 'Stage {n}',
    'result.where.level': 'Level {n}',

    'canvas.ready': 'READY!',
    'canvas.stageClear': 'STAGE CLEAR!',
    'canvas.stageClear.sub': 'Get ready for the cutscene…',

    'cutscene.title': '★ STAGE {n} COMPLETE! ★',
    'cutscene.tap': 'TAP OR PRESS SPACE FOR BONUS (+100)',
    'cutscene.total': 'BONUS: +{n} PTS',
    'cutscene.skip': 'SKIP [P] >>',

    'hint.move.touch': 'Swipe on the board or use the D-pad to move.',
    'hint.move.keys': 'Use the arrow keys or WASD to move.',
    'hint.pellets': 'Eat every pellet to clear the stage.',
    'hint.power': 'The big pellets turn ghosts blue. Grab one!',
    'hint.scared': 'Chase the blue ghosts: each one in a row doubles the points.',
    'hint.fruit': 'A bonus fruit appeared in the center. Grab it!',
    'hint.tunnel': 'Side tunnels wrap to the other edge.',
    'hint.portal': 'Corner portals teleport you across the maze.',

    'toast.extraLife': '❤ EXTRA LIFE!',
    'toast.gamepad': 'Gamepad connected',
    'toast.soundOn': 'Sound on',
    'toast.soundOff': 'Sound off',
    'toast.reset': 'Progress reset',
    'toast.resetConfirm': 'Tap again to confirm',

    'sr.stageStart': '{name}. Get ready.',
    'sr.lifeLost': 'Life lost. {n} left.',
    'sr.power': 'Power mode! Ghosts are vulnerable.',
    'sr.paused': 'Game paused.',
    'sr.resumed': 'Game resumed.',
    'sr.extraLife': 'Extra life!',
    'sr.gameOver': 'Game over. Final score {score}.',

    'howto.title': 'HOW TO PLAY',
    'howto.back': 'Back',
    'howto.next': 'Next',
    'howto.done': 'Let’s play!',
    'howto.s1.title': '1 · Move',
    'howto.s1.text': 'Steer Pac-Man through the maze. He keeps going until you pick a new direction, and the turn happens at the next opening.',
    'howto.ctrl.keyboard': 'Keyboard',
    'howto.ctrl.keyboard.text': 'Arrow keys or WASD',
    'howto.ctrl.touch': 'Touch',
    'howto.ctrl.touch.text': 'Swipe on the board or use the D-pad',
    'howto.ctrl.gamepad': 'Gamepad',
    'howto.ctrl.gamepad.text': 'D-pad or left stick, Start to pause',
    'howto.s2.title': '2 · Clear the maze',
    'howto.s2.text': 'Eat every pellet to finish the stage. Avoid the ghosts: one touch costs a life.',
    'howto.pellet': 'Pellet',
    'howto.power': 'Power pellet',
    'howto.fruit': 'Bonus fruit',
    'howto.fruit.points': '100 to 1000',
    'howto.s3.title': '3 · Turn the tables',
    'howto.s3.text': 'A power pellet turns the ghosts blue for a few seconds. Chase them: each one eaten in a row is worth double.',
    'howto.s3.note': 'When they start flashing white, the effect is about to end!',
    'howto.s4.title': '4 · Know your enemies',
    'ghost.blinky': 'Chases you head-on.',
    'ghost.pinky': 'Ambusher: aims 4 tiles ahead of you.',
    'ghost.inky': 'Flanker: aims 2 tiles ahead of you.',
    'ghost.clyde': 'Shy: chases from afar, flees to his corner when close.',
    'howto.s5.title': '5 · Tunnels, portals and tips',
    'howto.tip.tunnel': 'Side tunnels wrap you to the other edge. Ghosts slow down inside them.',
    'howto.tip.portal': 'From stage 3, corner portals teleport you diagonally across the maze.',
    'howto.tip.reverse': 'You can reverse instantly in any corridor. Use it to dodge.',
    'howto.tip.endless': 'Endless mode repeats the stages, each lap a little faster.',

    'settings.language': 'Language',
    'settings.sfx': 'Sound effects',
    'settings.haptics': 'Vibration',
    'settings.haptics.hint': 'Haptic feedback on supported phones',
    'settings.motion': 'Reduce motion',
    'settings.motion.hint': 'Fewer flashes, calmer menu, no screen effects',
    'settings.dpad': 'On-screen D-pad',
    'settings.dpad.hint': 'Auto shows it on touch screens',
    'settings.auto': 'Auto',
    'settings.on': 'On',
    'settings.off': 'Off',
    'settings.reset': 'Reset progress',
    'settings.reset.hint': 'Erases scores and tutorial progress',
    'settings.reset.btn': 'Reset',

    'scores.mode': 'Mode',
    'scores.score': 'Best score',
    'scores.reached': 'Furthest',
    'scores.played': 'Games played: {n}',
    'scores.stage': 'S{n}',
    'scores.level': 'L{n}',

    'phase.classic.name': 'The Classic',
    'phase.classic.feature': 'Side Tunnel',
    'phase.classic.fruit': 'Cherry',
    'phase.emerald.name': 'Emerald Gardens',
    'phase.emerald.feature': 'Double Tunnels',
    'phase.emerald.fruit': 'Strawberry',
    'phase.crimson.name': 'Crimson Retro',
    'phase.crimson.feature': 'Corner Portals',
    'phase.crimson.fruit': 'Orange',
    'phase.golden.name': 'Golden Fortress',
    'phase.golden.feature': 'Express Corridors',
    'phase.golden.fruit': 'Apple',
    'phase.quantum.name': 'Quantum Dimension',
    'phase.quantum.feature': 'Portals + Max Speed',
    'phase.quantum.fruit': 'Master Key'
  },

  pt: {
    'a11y.skip': 'Pular para o menu',
    'a11y.board': 'Tabuleiro do jogo. {mode}, {name}.',

    'menu.tagline': '5 fases · 5 temas · glória infinita',
    'menu.play': 'JOGAR',
    'menu.mode': 'MODO',
    'menu.difficulty': 'DIFICULDADE',
    'menu.theme': 'TEMA',

    'theme.classic': 'Clássico',
    'theme.retro': 'Retrô',
    'theme.modern': 'Moderno',
    'theme.pastel': 'Pastel',
    'theme.minimal': 'Minimal',
    'theme.classic.hint': 'O visual de fliperama: labirinto azul no fundo preto.',
    'theme.retro.hint': 'Pixels 8-bit e linhas de TV de tubo.',
    'theme.modern.hint': 'Tubos de neon brilhando no escuro.',
    'theme.pastel.hint': 'Cores suaves de doce, leves para os olhos.',
    'theme.minimal.hint': 'Linhas limpas e tons neutros futuristas.',
    'menu.howto': 'Como jogar',
    'menu.scores': 'Recordes',
    'menu.settings': 'Ajustes',
    'menu.keys': 'Setas / Tab para navegar · Enter para selecionar',
    'menu.best': 'Recorde · {diff} · {mode}: {score}',

    'mode.campaign': 'Campanha',
    'mode.endless': 'Infinito',
    'mode.campaign.hint': 'Complete as 5 fases para virar campeão do arcade.',
    'mode.endless.hint': 'As fases se repetem para sempre e os fantasmas aceleram a cada volta.',

    'diff.easy': 'Fácil',
    'diff.normal': 'Normal',
    'diff.hard': 'Difícil',
    'diff.easy.hint': '{lives} vidas · fantasmas mais lentos · poder mais longo',
    'diff.normal.hint': '{lives} vidas · o desafio clássico',
    'diff.hard.hint': '{lives} vidas · fantasmas mais rápidos · poder curto',

    'hud.score': 'PONTOS',
    'hud.best': 'RECORDE',
    'hud.lives': 'VIDAS',
    'hud.stage': 'FASE {n}/{max}',
    'hud.level': '∞ NÍVEL {n}',

    'btn.pause': 'Pausar',
    'btn.resume': 'Continuar',
    'btn.sound': 'Som ligado/desligado',
    'btn.fullscreen': 'Tela cheia',
    'btn.fullscreen.exit': 'Sair da tela cheia',
    'btn.close': 'Fechar',
    'dpad.label': 'Direcional na tela',
    'dir.up': 'Cima',
    'dir.down': 'Baixo',
    'dir.left': 'Esquerda',
    'dir.right': 'Direita',

    'keys.move': 'Mover',
    'keys.pause': 'Pausar',
    'keys.fullscreen': 'Tela cheia',
    'keys.mute': 'Mudo',

    'pause.title': 'PAUSADO',
    'pause.resume': 'Continuar',
    'pause.restart': 'Recomeçar',
    'pause.quit': 'Sair para o menu',

    'briefing.unlocked': '★ FASE {n}/{max} DESBLOQUEADA ★',
    'briefing.endless': '∞ INFINITO · NÍVEL {n}',
    'briefing.new': 'NOVIDADE',
    'briefing.fruit': 'FRUTA BÔNUS',
    'briefing.speed': 'VELOCIDADE DOS FANTASMAS',
    'briefing.speed.up': '+{n}% mais rápidos',
    'briefing.speed.base': 'Velocidade base',
    'briefing.bonus': 'Bônus da animação',
    'briefing.enterStage': '▶ ENTRAR NA FASE {n}',
    'briefing.enterLevel': '▶ ENTRAR NO NÍVEL {n}',

    'result.gameover': 'FIM DE JOGO',
    'result.gameover.text': 'Pontuação final: {score} · {where}',
    'result.victory': 'CAMPEÃO DO ARCADE!',
    'result.victory.text': 'Você completou as {max} fases com {score} pontos!',
    'result.playAgain': '↻ JOGAR DE NOVO',
    'result.menu': '⌂ MENU',
    'result.endless': '♾ CONTINUAR (INFINITO)',
    'result.newBest': '★ NOVO RECORDE PESSOAL ★',
    'result.where.stage': 'Fase {n}',
    'result.where.level': 'Nível {n}',

    'canvas.ready': 'PRONTO!',
    'canvas.stageClear': 'FASE COMPLETA!',
    'canvas.stageClear.sub': 'Preparando a animação…',

    'cutscene.title': '★ FASE {n} COMPLETA! ★',
    'cutscene.tap': 'TOQUE OU ESPAÇO PARA BÔNUS (+100)',
    'cutscene.total': 'BÔNUS: +{n} PTS',
    'cutscene.skip': 'PULAR [P] >>',

    'hint.move.touch': 'Deslize no tabuleiro ou use o direcional para mover.',
    'hint.move.keys': 'Use as setas ou WASD para mover.',
    'hint.pellets': 'Coma todas as pílulas para completar a fase.',
    'hint.power': 'As pílulas grandes deixam os fantasmas azuis. Pegue uma!',
    'hint.scared': 'Persiga os fantasmas azuis: cada um seguido vale o dobro.',
    'hint.fruit': 'Uma fruta bônus apareceu no centro. Pegue!',
    'hint.tunnel': 'Os túneis laterais levam ao outro lado da tela.',
    'hint.portal': 'Os portais dos cantos teletransportam você pelo labirinto.',

    'toast.extraLife': '❤ VIDA EXTRA!',
    'toast.gamepad': 'Controle conectado',
    'toast.soundOn': 'Som ligado',
    'toast.soundOff': 'Som desligado',
    'toast.reset': 'Progresso apagado',
    'toast.resetConfirm': 'Toque de novo para confirmar',

    'sr.stageStart': '{name}. Prepare-se.',
    'sr.lifeLost': 'Vida perdida. Restam {n}.',
    'sr.power': 'Modo poder! Os fantasmas estão vulneráveis.',
    'sr.paused': 'Jogo pausado.',
    'sr.resumed': 'Jogo retomado.',
    'sr.extraLife': 'Vida extra!',
    'sr.gameOver': 'Fim de jogo. Pontuação final {score}.',

    'howto.title': 'COMO JOGAR',
    'howto.back': 'Voltar',
    'howto.next': 'Próximo',
    'howto.done': 'Vamos jogar!',
    'howto.s1.title': '1 · Mover',
    'howto.s1.text': 'Conduza o Pac-Man pelo labirinto. Ele segue em frente até você escolher outra direção, e a curva acontece na próxima abertura.',
    'howto.ctrl.keyboard': 'Teclado',
    'howto.ctrl.keyboard.text': 'Setas ou WASD',
    'howto.ctrl.touch': 'Toque',
    'howto.ctrl.touch.text': 'Deslize no tabuleiro ou use o direcional',
    'howto.ctrl.gamepad': 'Controle',
    'howto.ctrl.gamepad.text': 'Direcional ou analógico, Start pausa',
    'howto.s2.title': '2 · Limpe o labirinto',
    'howto.s2.text': 'Coma todas as pílulas para terminar a fase. Fuja dos fantasmas: um toque custa uma vida.',
    'howto.pellet': 'Pílula',
    'howto.power': 'Pílula de poder',
    'howto.fruit': 'Fruta bônus',
    'howto.fruit.points': '100 a 1000',
    'howto.s3.title': '3 · Vire o jogo',
    'howto.s3.text': 'Uma pílula de poder deixa os fantasmas azuis por alguns segundos. Persiga-os: cada um comido em sequência vale o dobro.',
    'howto.s3.note': 'Quando começarem a piscar em branco, o efeito está acabando!',
    'howto.s4.title': '4 · Conheça os inimigos',
    'ghost.blinky': 'Persegue você de frente.',
    'ghost.pinky': 'Emboscada: mira 4 casas à sua frente.',
    'ghost.inky': 'Flanco: mira 2 casas à sua frente.',
    'ghost.clyde': 'Tímido: persegue de longe e foge para o canto quando perto.',
    'howto.s5.title': '5 · Túneis, portais e dicas',
    'howto.tip.tunnel': 'Os túneis laterais levam você ao outro lado. Os fantasmas ficam lentos dentro deles.',
    'howto.tip.portal': 'A partir da fase 3, portais nos cantos teletransportam você na diagonal.',
    'howto.tip.reverse': 'Você pode inverter a direção na hora em qualquer corredor. Use para escapar.',
    'howto.tip.endless': 'O modo infinito repete as fases, cada volta um pouco mais rápida.',

    'settings.language': 'Idioma',
    'settings.sfx': 'Efeitos sonoros',
    'settings.haptics': 'Vibração',
    'settings.haptics.hint': 'Resposta tátil em celulares compatíveis',
    'settings.motion': 'Reduzir movimento',
    'settings.motion.hint': 'Menos flashes, menu mais calmo, sem efeitos de tela',
    'settings.dpad': 'Direcional na tela',
    'settings.dpad.hint': 'Automático mostra em telas de toque',
    'settings.auto': 'Auto',
    'settings.on': 'Ligado',
    'settings.off': 'Desligado',
    'settings.reset': 'Apagar progresso',
    'settings.reset.hint': 'Apaga recordes e o progresso do tutorial',
    'settings.reset.btn': 'Apagar',

    'scores.mode': 'Modo',
    'scores.score': 'Melhor pontuação',
    'scores.reached': 'Mais longe',
    'scores.played': 'Partidas jogadas: {n}',
    'scores.stage': 'F{n}',
    'scores.level': 'N{n}',

    'phase.classic.name': 'O Clássico',
    'phase.classic.feature': 'Túnel Lateral',
    'phase.classic.fruit': 'Cereja',
    'phase.emerald.name': 'Jardins Esmeralda',
    'phase.emerald.feature': 'Túneis Duplos',
    'phase.emerald.fruit': 'Morango',
    'phase.crimson.name': 'Carmesim Retrô',
    'phase.crimson.feature': 'Portais nos Cantos',
    'phase.crimson.fruit': 'Laranja',
    'phase.golden.name': 'Fortaleza Dourada',
    'phase.golden.feature': 'Corredores Expressos',
    'phase.golden.fruit': 'Maçã',
    'phase.quantum.name': 'Dimensão Quântica',
    'phase.quantum.feature': 'Portais + Velocidade Máxima',
    'phase.quantum.fruit': 'Chave Mestra'
  }
};

let current = DEFAULT_LANG;
const listeners = new Set();

export function getLang() {
  return current;
}

export function isSupported(code) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, code);
}

/** Translate a key, replacing {placeholders}. Falls back to English, then to the key itself. */
export function t(key, params) {
  const raw = DICT[current]?.[key] ?? DICT[DEFAULT_LANG][key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}

export function formatNumber(n) {
  return Math.floor(n).toLocaleString(LANGUAGES[current].locale);
}

export function setLang(code) {
  if (!isSupported(code)) code = DEFAULT_LANG;
  current = code;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = LANGUAGES[code].htmlLang;
    applyDom(document);
  }
  listeners.forEach((fn) => fn(code));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Apply translations to every annotated element under root. */
export function applyDom(root) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  });
}
