// ============================================================
// ゲームロジック(UIに依存しない純ロジック)
// ============================================================

// 候補地点ラベル: A, B, C, D...(SPOT_COUNTに応じて生成)
const SPOT_LABELS = Array.from({ length: CONFIG.SPOT_COUNT }, (_, i) =>
  String.fromCharCode(65 + i)
);

const Game = {
  session: null,

  // 承諾率 = 基本70% + セッション履歴×5%(上限95%)
  acceptRate(sessions) {
    return Math.min(
      CONFIG.BASE_ACCEPT_RATE + sessions * CONFIG.ACCEPT_RATE_PER_SESSION,
      CONFIG.ACCEPT_RATE_MAX
    );
  },

  // 審査。trueなら承諾
  judge(charId) {
    const rec = Storage.record(charId);
    return Math.random() < this.acceptRate(rec.sessions);
  },

  // 承諾後、採掘セッションを開始(信頼度決定・正解地点・ヒント生成)
  startSession(char) {
    const sessions = Storage.record(char.id).sessions;
    const trust = char.getTrust(sessions);
    const correctSpot =
      SPOT_LABELS[Math.floor(Math.random() * SPOT_LABELS.length)];

    // hintMode 'eliminate'(ジャニス型): hintSpotは「避けるべき地点」の意味になる。
    // trustは「本当にハズレを教えてくれる確率」(逆に正解を消してしまうこともある)
    const others = SPOT_LABELS.filter((s) => s !== correctSpot);
    let hintSpot;
    if (char.hintMode === 'eliminate') {
      hintSpot =
        Math.random() < trust
          ? others[Math.floor(Math.random() * others.length)]
          : correctSpot;
    } else if (Math.random() < trust) {
      hintSpot = correctSpot;
    } else {
      hintSpot = others[Math.floor(Math.random() * others.length)];
    }

    this.session = {
      char,
      trust,
      correctSpot,
      hintSpot,
      hintText: char.hintLine(hintSpot, trust),
      chosenSpot: null,
      taps: [],
    };
    return this.session;
  },

  // タップ精度 = 1 - (ゾーン中心からのズレ距離 / 最大距離)、0〜1にクランプ
  // pos: インジケーター位置 0〜1(ゾーン中心は0.5、最大距離は0.5)
  tapAccuracy(pos) {
    const acc = 1 - Math.abs(pos - 0.5) / 0.5;
    return Math.max(0, Math.min(1, acc));
  },

  // 精算(指示書 §3-5)。採れた共鳴石は相棒と山分けする
  settle() {
    const s = this.session;
    const avg = s.taps.reduce((a, b) => a + b, 0) / s.taps.length;
    const hit = s.chosenSpot === s.correctSpot;
    const bonus = hit ? 1.0 : CONFIG.MISS_PENALTY;
    const gain = Math.round(avg * bonus * CONFIG.RESONANCE_COEF);
    const sync = Math.round(avg * 100);

    // 端数はプレイヤー取り分に寄せ、二つの取り分の合計が必ずgainと一致するようにする
    const playerShare = Math.round(gain * CONFIG.PLAYER_SHARE);
    const partnerShare = gain - playerShare;

    let lineKey;
    if (!hit) lineKey = 'miss';
    else if (sync >= CONFIG.SYNC_HIGH) lineKey = 'high';
    else if (sync >= CONFIG.SYNC_MID) lineKey = 'mid';
    else lineKey = 'low';

    return {
      char: s.char,
      hit,
      correctSpot: s.correctSpot,
      chosenSpot: s.chosenSpot,
      gain,
      playerShare,
      partnerShare,
      sync,
      line: s.char.resultLines[lineKey],
    };
  },
};
