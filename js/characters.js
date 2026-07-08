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
  {
    id: 'jack',
    name: 'ジャック',
    species: 'シャーマン系',
    color: '#e0703f',
    img: 'assets/jack.png',
    cardLine: '気軽にいこ〜。波長合えば、いい石採れるって',
    acceptLine: 'おっけ、行こ行こ',
    rejectLine: '今日はパスで。なんか波長合わない気がすんだよね〜',
    rejectRepeatLine: 'いや今日はマジで…また今度な?',
    // 信頼度: 関係で伸びる(セッションを重ねるほど波長が合ってくる)
    getTrust: (sessions = 0) =>
      Math.min(
        CONFIG.JACK_TRUST_BASE + sessions * CONFIG.JACK_TRUST_PER_SESSION,
        CONFIG.JACK_TRUST_MAX
      ),
    hintLine: (spot, trust) =>
      trust >= CONFIG.JACK_CONFIDENT_THRESHOLD
        ? `${spot}。うん、君とならわかる。行こ`
        : `んー…${spot}かなあ。まだ君の感じ掴めてなくてさ`,
    resultLines: {
      high: 'な? 息合うと気持ちいいっしょ',
      mid: 'まあまあ! こんな日もあるって',
      low: 'あちゃ〜、ちょいズレたな',
      miss: 'あー、ズレたか。ごめんごめん',
    },
  },
  {
    id: 'chester',
    name: 'チェスター',
    species: 'ゾンビ系',
    color: '#8a5a3a',
    img: 'assets/chester.png',
    cardLine: 'お、俺? …や、やれるっすよ。たぶん。…いや、やる',
    acceptLine: 'よ、よし。行くぞ、俺は準備できてる',
    rejectLine: 'いや待て待て、今日は無理。手が震えてる',
    rejectRepeatLine: 'しつこい! …いや、ごめん。でも無理なもんは無理で',
    // 信頼度: 強気/弱気の二択(セッションごとにランダム)。
    // 言い回しがそのまま信頼度のヒントになる仕掛け
    getTrust: () =>
      Math.random() < CONFIG.CHESTER_CONFIDENT_CHANCE
        ? CONFIG.CHESTER_TRUST_CONFIDENT
        : CONFIG.CHESTER_TRUST_UNSURE,
    hintLine: (spot, trust) =>
      trust >= CONFIG.CHESTER_MOOD_THRESHOLD
        ? `${spot}だ。断言する。ここ以外ありえねぇ`
        : `${spot}…かも…いや自信ねぇ、任せるわ…`,
    resultLines: {
      high: 'だろ!? 言った通りだろ!(半泣き)',
      mid: 'ま、まあ悪くない…よな?',
      low: 'ほら見ろ…って言うほどでもないか…',
      miss: '…ほら見ろ、だから怖かったんだよ…',
    },
  },
  {
    id: 'janice',
    name: 'ジャニス',
    species: 'ロボット系',
    color: '#c9a227',
    img: 'assets/janice.png',
    hintMode: 'eliminate', // ヒントは「正解」ではなく「避けるべき地点」を示す
    cardLine: '実力があるなら組んであげる。時間の無駄は嫌いなの',
    acceptLine: '合格。ついてきて、遅れないでね',
    rejectLine: '今日はやめておくわ。あなた、まだ私に釣り合わない',
    rejectRepeatLine: '……気が変わるとでも? 無駄よ',
    // 信頼度: 消去法ヒントの的中率(「ここは無い」が本当に外れである確率)
    getTrust: () => CONFIG.JANICE_TRUST,
    // hintSpotは「避けるべき地点」。的中率通りに真のハズレを消すが、
    // たまに(1-的中率)正解地点を誤って消してしまう
    hintLine: (spot) => `${spot}は死んでるわ。そこは掘るだけ無駄。あとは自分で読みなさい`,
    resultLines: {
      high: 'ええ、この程度は当然。次も期待してる',
      mid: '及第点、ってところね',
      low: '……もう少し丁寧に読みなさい',
      miss: '私は外れを教えた。選んだのはあなたよ',
    },
  },
];

function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id);
}
