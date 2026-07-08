// ============================================================
// キャラクターデータ(指示書 §5)
// 台詞はすべてここで定義済みのテキストのみ使用する
// ============================================================
const CHARACTERS = [
  {
    id: 'pete',
    name: 'ピート',
    species: 'ロボット系',
    color: '#c94f42',          // 赤系プレースホルダー
    img: 'assets/pete.png',    // 立ち絵スロット
    cardLine: '僕、頑張ります! センサーの精度には自信あるんで!',
    acceptLine: 'はい! 喜んで! 行きましょう!',
    rejectLine: '今日はちょっと…僕まだ実績少ないんで、無理しない方がいいかもです',
    rejectRepeatLine: 'そ、そんなに期待されると逆にプレッシャーというか…',
    // 信頼度: 65%(固定)
    getTrust: () => 0.65,
    hintLine: (spot, trust) => `${spot}です! 僕のセンサーが反応してます!`,
    resultLines: {
      high: 'ほら、やっぱり僕の勘、完璧じゃないですか!?',
      mid: 'まあまあ、って感じですかね! 次はもっといけます!',
      low: 'あ、あれ? 息が合わなかったですね…',
      miss: 'あれ、おかしいな…センサー、今日調子悪いのかも',
    },
  },
  {
    id: 'julian',
    name: 'ジュリアン',
    species: 'シャーマン系',
    color: '#4c8f5a',          // 緑系プレースホルダー
    img: 'assets/julian.png',
    cardLine: '……仕事なら、受けます',
    acceptLine: 'いいでしょう。行きます',
    rejectLine: '今日はやめておきます。あなたと組んでも、いい結果にならない気がするので',
    rejectRepeatLine: '……気が変わるとでも?',
    // 信頼度: 90%(固定)
    getTrust: () => 0.90,
    hintLine: (spot, trust) => `${spot}。……それだけです`,
    resultLines: {
      high: '……悪くなかったですね',
      mid: '可もなく不可もなく、です',
      low: '……集中してください。次は',
      miss: '……今のは、外れですね。次は外しません。',
    },
  },
  {
    id: 'patty',
    name: 'パティ',
    species: 'ゾンビ系',
    color: '#3a9a90',          // 青緑系プレースホルダー
    img: 'assets/patty.png',
    cardLine: '稼げる話? なら聞くけど',
    acceptLine: 'いいよ、行こ。さっさと稼ご',
    rejectLine: '今日はナシ。あたし二日酔いでキレそうなんだよね',
    rejectRepeatLine: 'しつこいって。明日にしなよ',
    // 信頼度: 変動型。セッション開始時に40%〜90%からランダムに決定
    getTrust: () =>
      CONFIG.PATTY_TRUST_MIN +
      Math.random() * (CONFIG.PATTY_TRUST_MAX - CONFIG.PATTY_TRUST_MIN),
    // 内部信頼度60%未満の日は不調時の言い回し
    hintLine: (spot, trust) =>
      trust < CONFIG.PATTY_LOW_MOOD_THRESHOLD
        ? `んー…${spot}? かなあ…ちょっと自信ない`
        : `${spot}だね。あたしの勘、今日冴えてるよ`,
    resultLines: {
      high: 'へえ、やるじゃん。今夜あたしが奢ってやるよ',
      mid: 'ま、こんなもんでしょ',
      low: 'あー最悪、飲みすぎた…次はもっと稼げよ',
      miss: '…ごめん、外した。今日のあたしはハズレの日だわ',
    },
  },
];

function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id);
}
