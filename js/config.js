// ============================================================
// 数値パラメータ(指示書 §4-2)— チューニングはここだけ触ればよい
// ============================================================
const CONFIG = {
  // 採掘フェーズ1
  SPOT_COUNT: 4,                    // 候補地点数
  // 地図上のピン座標(.dig-map に対する%指定)。全ピン同じ見た目・
  // 同じ地面(結晶のない一角)に置くことで正解を視覚的に匂わせない
  DIG_MAP_PIN_POSITIONS: [
    { x: 22, y: 66 },
    { x: 42, y: 34 },
    { x: 63, y: 70 },
    { x: 80, y: 38 },
  ],

  // 採掘フェーズ2
  TAP_COUNT: 3,                     // タップ回数
  ZONE_WIDTH: 0.20,                 // 成功ゾーン幅(全体に対する割合)
  INDICATOR_SPEED_PER_FRAME: 0.022, // インジケーター速度(2.2%/frame)
  FPS_BASE: 60,                     // 上記速度の基準fps(実装は時間ベースで換算)

  // 精算
  RESONANCE_COEF: 120,              // 共鳴の係数
  MISS_PENALTY: 0.5,                // 不正解ペナルティ

  // 審査(初対面は半分以上の確率で断られる。セッションを重ねるごとに
  // 信頼が積み上がっていく体感を出すため、上限到達には10回前後かかる)
  BASE_ACCEPT_RATE: 0.40,           // 基本承諾率
  ACCEPT_RATE_PER_SESSION: 0.05,    // セッション履歴1回ごとの承諾率上昇
  ACCEPT_RATE_MAX: 0.95,            // 承諾率の上限

  // パティの変動信頼度
  PATTY_TRUST_MIN: 0.40,
  PATTY_TRUST_MAX: 0.90,
  PATTY_LOW_MOOD_THRESHOLD: 0.60,   // これ未満の日は「不調時」の言い回し

  // ジャック: 関係で伸びる信頼度(セッションを重ねるほど波長が合ってくる)
  JACK_TRUST_BASE: 0.60,
  JACK_TRUST_PER_SESSION: 0.04,
  JACK_TRUST_MAX: 0.90,
  JACK_CONFIDENT_THRESHOLD: 0.75,   // これ以上で「確信した」言い回しに変わる

  // チェスター: 強気/弱気の二択(セッションごとにランダム)。
  // 言い回し(強気/弱気)がそのまま信頼度のヒントになる
  CHESTER_TRUST_CONFIDENT: 0.85,
  CHESTER_TRUST_UNSURE: 0.40,
  CHESTER_CONFIDENT_CHANCE: 0.5,
  CHESTER_MOOD_THRESHOLD: 0.6,

  // ジャニス: 消去法ヒント。「ここは無い」と示した地点が本当にハズレである確率
  // (外れた場合は逆に正解地点を消してしまう=たまに大きく外す)
  JANICE_TRUST: 0.85,

  // 精算時の台詞分岐しきい値(シンクロ率%)
  SYNC_HIGH: 80,
  SYNC_MID: 50,

  // 山分けの取り分(プレイヤー側の割合)
  PLAYER_SHARE: 0.5,
};
