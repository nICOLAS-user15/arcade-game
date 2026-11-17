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

    'menu.tagline': '5 stages · 4 themes · endless glory',
    'menu.play': 'PLAY',
    'menu.gameMode': 'GAME MODE',
    'menu.mode': 'MODE',
    'menu.difficulty': 'DIFFICULTY',
    'menu.theme': 'THEME',

    'theme.classic': 'Classic',
    'theme.retro': 'Retro',
    'theme.pastel': 'Pastel',
    'theme.minimal': 'Minimal',
    'theme.classic.hint': 'The arcade look: a blue maze on black.',
    'theme.retro.hint': 'Chunky 8-bit pixels and CRT scanlines.',
    'theme.pastel.hint': 'Candy colors and bubbles on a night sky.',
    'theme.minimal.hint': 'Black and white, raw brutalist slabs.',
    'menu.howto': 'How to play',
    'menu.scores': 'High scores',
    'menu.install': 'Install app',
    'install.title': 'ADD TO HOME SCREEN',
    'install.step1': 'Tap the Share button in your browser (the square with an arrow).',
    'install.step2': 'Choose “Add to Home Screen”.',
    'install.step3': 'Tap “Add”. The game opens like a normal app and even works offline.',
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
    'diff.hardcore': 'Hardcore',
    'diff.hardcore.hint': '1 life · no extra life · maximum speed',
    'diff.custom': 'Custom',
    'diff.custom.hint': '{lives} lives · ghosts at {speed}% · not ranked',
    'diff.lives': '{n} lives',
    'diff.life': '1 life',
    'diff.speed': 'Ghost speed {n} of 4',

    'mode.campaign.card': '5 stages and a grand finale',
    'mode.endless.card': 'Never ends, gets faster every lap',
    'mode.cardBest': 'Best {score}',
    'mode.cardNoBest': 'No record yet',

    'custom.lives': 'Lives',
    'custom.speed': 'Ghost speed',

    'menu.startStage': 'START STAGE',
    'menu.startStage.hint': 'Reach a stage once to start Endless from it.',
    'menu.stageLocked': 'Stage {n}: locked',
    'char.pac': 'Pac-Man',
    'char.ms': 'Ms. Pac',
    'char.cherry': 'Cherry',
    'char.mint': 'Mint',
    'menu.preview': 'Preview of the {theme} theme',
    'menu.bestNone': 'No record here yet: set the first one!',
    'menu.bestCustom': 'Custom games are not ranked',
    'menu.summary': '{mode} · {diff} · {lives} · {char} · {theme}',
    'menu.quickPlay': 'Play again',

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
    'result.rank': 'You are #{n} on the high-score table',
    'initials.title': 'NEW HIGH SCORE!',
    'initials.rank': 'Rank #{n} · {score} pts',
    'initials.prompt': 'Enter your name',
    'initials.save': 'SAVE',
    'initials.skip': 'Skip',
    'result.where.stage': 'Stage {n}',
    'result.where.level': 'Level {n}',

    'canvas.ready': 'READY!',
    'canvas.go': 'GO!',
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
    'toast.installed': 'App installed!',

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
    'settings.theme': 'Theme',
    'settings.music': 'Music',
    'settings.music.hint': 'A soundtrack for the menu and every stage',
    'settings.sfx': 'Sound effects',
    'settings.musicVolume': 'Music volume',
    'settings.sfxVolume': 'Effects volume',
    'settings.haptics': 'Vibration',
    'settings.haptics.hint': 'Haptic feedback on supported phones',
    'settings.motion': 'Reduce motion',
    'settings.motion.hint': 'Still menu, no cutscenes, particles or flashing effects',
    'settings.haptics.unsupported': 'This phone or browser does not allow vibration (iPhone, for example)',
    'settings.dpad': 'On-screen D-pad',
    'settings.dpad.hint': 'Arrows for touch play',
    'settings.on': 'On',
    'settings.off': 'Off',
    'settings.reset': 'Reset progress',
    'settings.reset.hint': 'Erases scores and tutorial progress',
    'settings.reset.btn': 'Reset',
    'settings.character': 'Character',
    'settings.character.hint': 'Only changes the look, never the rules',
    'settings.credits': 'Credits',
    'settings.credits.hint': 'About the game and who made it',
    'settings.credits.btn': 'View',
    'credits.title': 'CREDITS',
    'credits.by': 'Designed and developed by',
    'credits.project.title': 'THE PROJECT',
    'credits.project.text': 'Pac-Man Arcade was conceived and built as an academic study project, to practise making a complete web game from scratch.',
    'credits.project.text2': 'It covers game design, ghost AI, synthesized music, a responsive layout for phones and desktops, accessibility, automated tests, security and publishing as an installable app.',
    'credits.ai.title': 'MADE WITH AI',
    'credits.ai.text': 'Artificial intelligence (Claude, by Anthropic) was used throughout as a programming assistant. Learning to work well with AI was one of the goals of the project.',
    'credits.ai.text2': "The idea, the creative direction, every design decision, the playtesting and the review of each change are Nicolas's work.",
    'credits.tech.title': 'TECHNOLOGY',
    'credits.tech.text': 'HTML5 Canvas and plain JavaScript, with no libraries. Music and sound effects are generated live with the Web Audio API. Fonts: Press Start 2P, Rajdhani, Silkscreen, VT323, Fredoka, Nunito, Space Mono and Space Grotesk (SIL Open Font License).',
    'credits.github': 'Nicolas on GitHub',
    'credits.source': 'Source code',
    'credits.legal': '© 2026 Nicolas de Moura · MIT License. Pac-Man and its characters are trademarks of their respective owners; this is a non-commercial tribute made for study.',

    'scores.rank': '#',
    'scores.name': 'Name',
    'scores.score': 'Score',
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

    'menu.tagline': '5 fases · 4 temas · glória infinita',
    'menu.play': 'JOGAR',
    'menu.gameMode': 'MODO DE JOGO',
    'menu.mode': 'MODO',
    'menu.difficulty': 'DIFICULDADE',
    'menu.theme': 'TEMA',

    'theme.classic': 'Clássico',
    'theme.retro': 'Retrô',
    'theme.pastel': 'Pastel',
    'theme.minimal': 'Minimal',
    'theme.classic.hint': 'O visual de fliperama: labirinto azul no fundo preto.',
    'theme.retro.hint': 'Pixels 8-bit e linhas de TV de tubo.',
    'theme.pastel.hint': 'Cores de doce e bolhas num céu noturno.',
    'theme.minimal.hint': 'Preto e branco, blocos brutalistas crus.',
    'menu.howto': 'Como jogar',
    'menu.scores': 'Recordes',
    'menu.install': 'Instalar app',
    'install.title': 'ADICIONAR À TELA INICIAL',
    'install.step1': 'Toque no botão Compartilhar do navegador (o quadrado com uma seta).',
    'install.step2': 'Escolha “Adicionar à Tela de Início”.',
    'install.step3': 'Toque em “Adicionar”. O jogo abre como um app normal e funciona até sem internet.',
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
    'diff.hardcore': 'Hardcore',
    'diff.hardcore.hint': '1 vida · sem vida extra · velocidade máxima',
    'diff.custom': 'Personalizado',
    'diff.custom.hint': '{lives} vidas · fantasmas a {speed}% · fora dos recordes',
    'diff.lives': '{n} vidas',
    'diff.life': '1 vida',
    'diff.speed': 'Velocidade dos fantasmas {n} de 4',

    'mode.campaign.card': '5 fases e um grande final',
    'mode.endless.card': 'Nunca acaba, acelera a cada volta',
    'mode.cardBest': 'Recorde {score}',
    'mode.cardNoBest': 'Sem recorde ainda',

    'custom.lives': 'Vidas',
    'custom.speed': 'Velocidade dos fantasmas',

    'menu.startStage': 'FASE INICIAL',
    'menu.startStage.hint': 'Alcance uma fase uma vez para começar o Infinito por ela.',
    'menu.stageLocked': 'Fase {n}: bloqueada',
    'char.pac': 'Pac-Man',
    'char.ms': 'Ms. Pac',
    'char.cherry': 'Cereja',
    'char.mint': 'Menta',
    'menu.preview': 'Prévia do tema {theme}',
    'menu.bestNone': 'Ainda sem recorde aqui: seja o primeiro!',
    'menu.bestCustom': 'Partidas personalizadas não entram nos recordes',
    'menu.summary': '{mode} · {diff} · {lives} · {char} · {theme}',
    'menu.quickPlay': 'Jogar de novo',

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
    'result.rank': 'Você é o #{n} na tabela de recordes',
    'initials.title': 'NOVO RECORDE!',
    'initials.rank': 'Posição #{n} · {score} pts',
    'initials.prompt': 'Digite seu nome',
    'initials.save': 'SALVAR',
    'initials.skip': 'Pular',
    'result.where.stage': 'Fase {n}',
    'result.where.level': 'Nível {n}',

    'canvas.ready': 'PRONTO!',
    'canvas.go': 'VAI!',
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
    'toast.installed': 'App instalado!',

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
    'settings.theme': 'Tema',
    'settings.music': 'Música',
    'settings.music.hint': 'Trilha sonora no menu e em cada estágio',
    'settings.sfx': 'Efeitos sonoros',
    'settings.musicVolume': 'Volume da música',
    'settings.sfxVolume': 'Volume dos efeitos',
    'settings.haptics': 'Vibração',
    'settings.haptics.hint': 'Resposta tátil em celulares compatíveis',
    'settings.motion': 'Reduzir movimento',
    'settings.motion.hint': 'Menu parado, sem cenas animadas, partículas ou efeitos piscando',
    'settings.haptics.unsupported': 'Este aparelho ou navegador não permite vibração (ex.: iPhone)',
    'settings.dpad': 'Direcional na tela',
    'settings.dpad.hint': 'Setas para jogar no toque',
    'settings.on': 'Ligado',
    'settings.off': 'Desligado',
    'settings.reset': 'Apagar progresso',
    'settings.reset.hint': 'Apaga recordes e o progresso do tutorial',
    'settings.reset.btn': 'Apagar',
    'settings.character': 'Personagem',
    'settings.character.hint': 'Só muda a aparência, nunca as regras',
    'settings.credits': 'Créditos',
    'settings.credits.hint': 'Sobre o jogo e quem o criou',
    'settings.credits.btn': 'Ver',
    'credits.title': 'CRÉDITOS',
    'credits.by': 'Idealizado e desenvolvido por',
    'credits.project.title': 'O PROJETO',
    'credits.project.text': 'Pac-Man Arcade foi pensado e desenvolvido como um projeto de estudo acadêmico, para praticar a criação de um jogo web completo do zero.',
    'credits.project.text2': 'Ele passa por game design, inteligência dos fantasmas, música sintetizada, layout responsivo para celular e computador, acessibilidade, testes automatizados, segurança e publicação como app instalável.',
    'credits.ai.title': 'FEITO COM IA',
    'credits.ai.text': 'Inteligência artificial (Claude, da Anthropic) foi usada ao longo do projeto como assistente de programação. Aprender a trabalhar bem com IA foi um dos objetivos do projeto.',
    'credits.ai.text2': 'A ideia, a direção criativa, cada decisão de design, os testes jogando e a revisão de cada mudança são trabalho do Nicolas.',
    'credits.tech.title': 'TECNOLOGIA',
    'credits.tech.text': 'HTML5 Canvas e JavaScript puro, sem bibliotecas. A música e os efeitos sonoros são gerados ao vivo com a Web Audio API. Fontes: Press Start 2P, Rajdhani, Silkscreen, VT323, Fredoka, Nunito, Space Mono e Space Grotesk (SIL Open Font License).',
    'credits.github': 'Nicolas no GitHub',
    'credits.source': 'Código-fonte',
    'credits.legal': '© 2026 Nicolas de Moura · Licença MIT. Pac-Man e seus personagens são marcas dos respectivos proprietários; este é um tributo sem fins comerciais, feito para estudo.',

    'scores.rank': '#',
    'scores.name': 'Nome',
    'scores.score': 'Pontos',
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
