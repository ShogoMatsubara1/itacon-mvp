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
    // 呼吸合わせ(フェーズ2): 素直だがやや前のめり。速度は少し速め、揺らぎなし
    breath: { speedMul: 1.16, wobble: () => 0, style: 'bright' },
    // 採掘フェーズ1: 地点選択直後のリアクション(agree=ヒントと同じ地点を選んだ)
    spotReaction: {
      agree: [
        'そこです! 僕のセンサーもそう言ってます!',
        'おお、いいですね! 僕もそこ、反応強めに感じてました!',
      ],
      disagree: [
        'え、そっちですか!? …でも全然アリだと思います!',
        '僕のセンサーとは違いますけど……その勘、嫌いじゃないです!',
      ],
    },
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
    // 呼吸合わせ(フェーズ2): 標準よりやや遅く、安定していてブレがない
    breath: { speedMul: 0.88, wobble: () => 0, style: 'calm' },
    spotReaction: {
      agree: [
        '……悪くない判断です',
        'そこなら、試す価値はあります',
      ],
      disagree: [
        '……そちらですか。止めはしません',
        '私の感覚とは違いますが……判断はあなたに任せます',
      ],
    },
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
    // 呼吸合わせ(フェーズ2): 気分屋。今日の調子(trust)が悪いほど揺らぎが大きい
    breath: {
      speedMul: 1.0,
      wobble: (trust) => {
        const t = (trust - CONFIG.PATTY_TRUST_MIN) / (CONFIG.PATTY_TRUST_MAX - CONFIG.PATTY_TRUST_MIN);
        return 0.55 - 0.4 * Math.max(0, Math.min(1, t));
      },
      style: 'moody',
    },
    spotReaction: {
      agree: [
        'そこね。いいじゃん、早くやろ',
        'あたしもそこだと思ってた。……たぶんね',
      ],
      disagree: [
        'そっち? まあ、アンタが言うならやるけど',
        'へえ、逆張りするじゃん。嫌いじゃないよ',
      ],
    },
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
    // 呼吸合わせ(フェーズ2): 脱力系。標準よりゆったりめ、揺らぎなし
    breath: { speedMul: 0.94, wobble: () => 0, style: 'chill' },
    spotReaction: {
      agree: [
        'そこそこ、俺もそんな気してた',
        'おっ、波長合ってきたじゃん。そこ行こ',
      ],
      disagree: [
        'え、そっち? …ま、たまにはそれもアリっしょ',
        '俺の勘とはズレてるけど、任せるわ。それもいいっしょ',
      ],
    },
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
    // 呼吸合わせ(フェーズ2): ビビり。強気の日は落ち着き、弱気の日は手元が震える
    breath: {
      speedMul: 1.0,
      wobble: (trust) => (trust >= CONFIG.CHESTER_MOOD_THRESHOLD ? 0.12 : 0.42),
      style: 'moody',
    },
    spotReaction: {
      agree: [
        'そ、そこだよな!? 俺もそう思ってた、マジで',
        'よし……そこで合ってる、はず。たぶん',
      ],
      disagree: [
        'え、そっち行くの!? …ま、まあ度胸あるじゃん',
        '俺の勘とは違うけど……お、俺は止めないからな!',
      ],
    },
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
    // 呼吸合わせ(フェーズ2): 精密で無駄がない。揺らぎなし、やや速め
    breath: { speedMul: 1.05, wobble: () => 0, style: 'sharp' },
    // hintMode='eliminate'のため、agree/disagreeの意味が他キャラと逆になる点に注意
    // (agree = 消去法の忠告どおり「そこは避けた」= 忠告に従った)
    spotReaction: {
      agree: [
        '妥当な判断ね。悪くないわ',
        'ええ、そこで構わない。話が早くて助かる',
      ],
      disagree: [
        '……そこ、死んでるって言ったでしょう。まあ、好きにすれば',
        '忠告は無視するのね。……後悔しないことよ',
      ],
    },
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
