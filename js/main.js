// ============================================================
// 画面遷移の制御・初期化
// ============================================================

const SCREENS = {
  opening: { el: 'screen-opening', ctrl: OpeningScreen, bg: 'itaconion' },
  reception: { el: 'screen-reception', ctrl: ReceptionScreen, bg: 'itaconion' },
  matching: { el: 'screen-matching', ctrl: MatchingScreen, bg: 'itaconion' },
  phase1: { el: 'screen-phase1', ctrl: Phase1Screen, bg: 'cave' },
  phase2: { el: 'screen-phase2', ctrl: Phase2Screen, bg: 'cave' },
  result: { el: 'screen-result', ctrl: ResultScreen, bg: 'cave' },
};

let currentScreen = null;

function showScreen(name) {
  if (currentScreen && SCREENS[currentScreen].ctrl.leave) {
    SCREENS[currentScreen].ctrl.leave();
  }
  Object.values(SCREENS).forEach((s) => {
    document.getElementById(s.el).classList.remove('active');
  });
  const screen = SCREENS[name];
  document.getElementById(screen.el).classList.add('active');
  document.getElementById('app').dataset.bg = screen.bg || '';
  if (screen.ctrl.enter) screen.ctrl.enter();
  currentScreen = name;
  window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
  Storage.load();

  // オープニング(導入): パネルのタップで進む / スキップで受付へ
  document.getElementById('prologue')
    .addEventListener('click', () => OpeningScreen.advance());
  document.getElementById('btn-skip-prologue')
    .addEventListener('click', () => OpeningScreen.finish());

  // 受付
  document.getElementById('btn-find-partner')
    .addEventListener('click', () => showScreen('matching'));
  document.getElementById('btn-replay-intro')
    .addEventListener('click', () => showScreen('opening'));

  // マッチング
  document.getElementById('btn-back-reception')
    .addEventListener('click', () => showScreen('reception'));
  document.getElementById('btn-pass')
    .addEventListener('click', () => MatchingScreen.pass());
  document.getElementById('btn-like')
    .addEventListener('click', () => MatchingScreen.like());

  // 憑依演出はタップでスキップ
  document.getElementById('possession-overlay')
    .addEventListener('click', () => PossessionFX.skip());

  // フェーズ1 → フェーズ2
  document.getElementById('btn-dig')
    .addEventListener('click', () => showScreen('phase2'));

  // フェーズ2 タップ
  document.getElementById('btn-tap')
    .addEventListener('click', () => Phase2Screen.tap());

  // 精算 → 受付
  document.getElementById('btn-return')
    .addEventListener('click', () => showScreen('reception'));

  // 初回は導入から、既読なら受付から始める
  showScreen(Storage.data.seenIntro ? 'reception' : 'opening');
});
