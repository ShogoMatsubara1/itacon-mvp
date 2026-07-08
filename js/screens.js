// ============================================================
// 各画面の描画とイベント処理
// ============================================================

const $ = (sel) => document.querySelector(sel);

// 数値は常に3桁区切りで表示する
const fmt = (n) => n.toLocaleString('ja-JP');

// 数値のカウントアップ演出(獲得量など「増えた実感」を出す場面用)
function animateCount(el, target, { prefix = '', duration = 750 } = {}) {
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = prefix + fmt(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---- 共通: 立ち絵スロット --------------------------------------
// 画像(assets/*.png)があれば表示、なければ色付きプレースホルダー
function makePortrait(char, extraClass) {
  const wrap = document.createElement('div');
  wrap.className = 'portrait' + (extraClass ? ' ' + extraClass : '');
  wrap.style.setProperty('--char-color', char.color);

  const ph = document.createElement('span');
  ph.className = 'portrait-ph';
  ph.textContent = char.name;
  wrap.appendChild(ph);

  const img = document.createElement('img');
  img.alt = char.name;
  img.onerror = () => img.remove(); // 画像が無ければプレースホルダーのまま
  img.src = char.img;
  wrap.appendChild(img);

  return wrap;
}

// ---- オープニング(導入) --------------------------------------
// 初見プレイヤーに「自分は何者で、ここは何なのか」を渡す。企画書の
// トーン(異世界バイト/裏稼業バディコメディ)に合わせた手配所のオヤジ語り。
const PROLOGUE_BEATS = [
  'いらっしゃい。あんた、遠いとこからはるばる出稼ぎに来た人間だろ?\n目当てはわかってる。この世界でしか採れない“共鳴石(きょうめいせき)”——あんたらの世界じゃ、バカ高く売れるらしいな。',
  'だが、よそ者が一人で坑道に入っても、石ころ一つ掘れやしない。あの石を掘るにゃ、この土地の“身体”がいるのさ。\nそこで、ここにいる連中 —— ITACON(イタコン)の出番だ。訳あって身体を貸して食ってる、この世界の住人さ。',
  'あんたは気に入った奴に“憑依”して、二人で一つになって働く。頭を使うのがあんた、身体を出すのが相棒だ。\nどこを掘るかは、あんたの勘で決めな。相棒がヒントはくれるが……信じるかは、あんた次第だ。',
  'あとは相棒と息を合わせて掘るだけ。二人のタイミングが噛み合うほど、石はごっそり採れる。\n採れた石は山分け。文句はナシだ。……さあ、相棒を選びに行きな。',
];

const OpeningScreen = {
  beat: 0,

  enter() {
    this.beat = 0;
    this.finishing = false;
    $('#app').classList.add('intro-dim');
    this.render();
  },

  render() {
    const el = $('#prologue-text');
    el.textContent = PROLOGUE_BEATS[this.beat];
    // クラス付け直し+リフローでビート切り替えのフェードを毎回再生
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');

    this.renderDots();
    const last = this.beat === PROLOGUE_BEATS.length - 1;
    $('#prologue-hint').textContent = last ? 'タップして手配所へ' : 'タップで進む';
  },

  renderDots() {
    const box = $('#prologue-dots');
    box.innerHTML = '';
    PROLOGUE_BEATS.forEach((_, i) => {
      const d = document.createElement('span');
      if (i <= this.beat) d.classList.add('on');
      box.appendChild(d);
    });
  },

  // パネルのタップで次のビートへ。最後まで来たら受付へ抜ける
  advance() {
    if (this.beat < PROLOGUE_BEATS.length - 1) {
      this.beat += 1;
      this.render();
    } else {
      this.finish();
    }
  },

  // スキップ/読了。暗幕をふわっと明るく戻してから受付へ抜ける。
  // 次回以降は受付から始まるよう既読フラグを保存
  finish() {
    if (this.finishing) return;
    this.finishing = true;
    Storage.markIntroSeen();
    $('#app').classList.remove('intro-dim');
    setTimeout(() => showScreen('reception'), 600);
  },
};

// ---- 受付 ------------------------------------------------------
const ReceptionScreen = {
  enter() {
    $('#total-resonance').innerHTML =
      `<span class="gem"></span>${fmt(Storage.data.totalResonance)}`;
  },
};

// ---- マッチング(スワイプ式) ----------------------------------
const MatchingScreen = {
  idx: 0,               // カードの巡回位置(3体をループ)
  lastRejectedId: null, // 「直前に拒否された相手」の追跡(画面内のみ、非永続)
  judgeTimer: null,
  busy: false,          // アニメーション・審査中の多重操作防止
  topCard: null,

  enter() {
    this.idx = 0;
    this.lastRejectedId = null;
    this.busy = false;
    this.renderStack();
    this.hideOverlay();
  },

  charAt(offset) {
    return CHARACTERS[(this.idx + offset) % CHARACTERS.length];
  },

  renderStack(entryAnim) {
    const stack = $('#card-stack');
    stack.innerHTML = '';
    const back = this.buildCard(this.charAt(1));
    back.classList.add('back');
    const top = this.buildCard(this.charAt(0));
    top.classList.add('top');
    if (entryAnim) top.classList.add(entryAnim);
    stack.append(back, top);
    this.topCard = top;
    this.attachDrag(top);
  },

  buildCard(char) {
    const rec = Storage.record(char.id);
    const card = document.createElement('div');
    card.className = 'swipe-card';
    card.style.setProperty('--char-color', char.color);

    card.appendChild(makePortrait(char, 'swipe-portrait'));

    const name = document.createElement('h3');
    name.className = 'swipe-name';
    name.innerHTML = `${char.name} <small>${char.species}</small>`;
    card.appendChild(name);

    const line = document.createElement('p');
    line.className = 'swipe-line';
    line.textContent = `「${char.cardLine}」`;
    card.appendChild(line);

    const record = document.createElement('p');
    record.className = 'swipe-record';
    record.textContent =
      rec.sessions > 0
        ? `いっしょに採掘${rec.sessions}回 / ベストシンクロ${rec.bestSync}% / 稼ぎ${fmt(rec.totalGain)}`
        : 'まだ組んだことがない';
    card.appendChild(record);

    // ドラッグ中に浮かび上がるスタンプ
    const like = document.createElement('div');
    like.className = 'stamp like';
    like.textContent = '依頼';
    const pass = document.createElement('div');
    pass.className = 'stamp pass';
    pass.textContent = 'パス';
    card.append(like, pass);

    return card;
  },

  // ---- ドラッグ(ポインタ)操作 ----
  attachDrag(card) {
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dragging = false;
    const likeStamp = card.querySelector('.stamp.like');
    const passStamp = card.querySelector('.stamp.pass');

    card.addEventListener('pointerdown', (e) => {
      if (this.busy) return;
      dragging = true;
      dx = 0;
      startX = e.clientX;
      startY = e.clientY;
      try {
        card.setPointerCapture(e.pointerId);
      } catch (err) {
        // 合成イベント等でキャプチャできなくてもドラッグ自体は成立する
      }
      card.classList.remove('settle');
    });

    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      card.style.transform =
        `translate(${dx}px, ${dy * 0.2}px) rotate(${dx * 0.05}deg)`;
      likeStamp.style.opacity = Math.min(Math.max(dx / 80, 0), 1);
      passStamp.style.opacity = Math.min(Math.max(-dx / 80, 0), 1);
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dx > 90) {
        this.commitRight(card);
      } else if (dx < -90) {
        this.commitLeft(card);
      } else {
        card.classList.add('settle');
        card.style.transform = '';
        likeStamp.style.opacity = 0;
        passStamp.style.opacity = 0;
      }
      dx = 0;
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  },

  // ボタン操作(スワイプと同じ動き)
  pass() {
    if (this.busy || !this.topCard) return;
    this.commitLeft(this.topCard);
  },
  like() {
    if (this.busy || !this.topCard) return;
    this.commitRight(this.topCard);
  },

  commitLeft(card) {
    if (this.busy) return;
    this.busy = true;
    card.querySelector('.stamp.pass').style.opacity = 1;
    card.classList.add('fly-left');
    setTimeout(() => {
      this.idx = (this.idx + 1) % CHARACTERS.length;
      this.busy = false;
      this.renderStack();
    }, 300);
  },

  commitRight(card) {
    if (this.busy) return;
    this.busy = true;
    card.querySelector('.stamp.like').style.opacity = 1;
    card.classList.add('fly-right');
    const char = this.charAt(0);
    setTimeout(() => this.request(char), 300);
  },

  // ---- 審査(依頼を出した後、相手が判断する) ----
  request(char) {
    this.showOverlay(char, '……相手が考えている……', null);
    this.judgeTimer = setTimeout(() => {
      const accepted = Game.judge(char.id);
      if (accepted) {
        this.lastRejectedId = null;
        this.showOverlay(char, `「${char.acceptLine}」`, {
          label: '憑依して坑道へ',
          onClick: () => {
            this.hideOverlay();
            Game.startSession(char);
            PossessionFX.play(char);
          },
        }, 'マッチ成立!');
      } else {
        // 直前に拒否された相手への連続申込は断り文句が変わる
        const line =
          this.lastRejectedId === char.id
            ? char.rejectRepeatLine
            : char.rejectLine;
        this.lastRejectedId = char.id;
        this.showOverlay(char, `「${line}」`, {
          label: 'そっか……',
          onClick: () => {
            this.hideOverlay();
            this.forceLeftSwipe();
          },
        });
      }
    }, 900);
  },

  // 断られたら、そのカードを強制的に左へスワイプして次の相手へ進める
  // (依頼で右へ飛んで行ったカードが、断られた末に戻ってきてそのまま
  // パスされる、という一続きの動き)
  forceLeftSwipe() {
    const card = this.topCard;
    card.classList.remove('fly-right', 'settle');
    void card.offsetWidth; // アニメーションを頭から再生
    card.classList.add('reject-swipe');
    setTimeout(() => {
      this.idx = (this.idx + 1) % CHARACTERS.length;
      this.busy = false;
      this.renderStack();
    }, 550);
  },

  showOverlay(char, text, action, title) {
    const overlay = $('#judge-overlay');
    overlay.classList.remove('hidden');

    const titleEl = $('#judge-title');
    if (title) {
      titleEl.textContent = title;
      titleEl.classList.remove('hidden');
    } else {
      titleEl.classList.add('hidden');
    }

    const portraitBox = $('#judge-portrait');
    portraitBox.innerHTML = '';
    portraitBox.appendChild(makePortrait(char, 'judge-portrait-img'));

    const textEl = $('#judge-text');
    textEl.textContent = text;
    textEl.classList.toggle('judging', !action);

    const btn = $('#btn-judge-action');
    if (action) {
      btn.textContent = action.label;
      btn.classList.remove('hidden');
      btn.onclick = action.onClick;
    } else {
      btn.classList.add('hidden');
      btn.onclick = null;
    }
  },

  hideOverlay() {
    clearTimeout(this.judgeTimer);
    $('#judge-overlay').classList.add('hidden');
  },
};

// ---- 採掘 フェーズ1(判断) ------------------------------------
const Phase1Screen = {
  enter() {
    const s = Game.session;

    const partnerBox = $('#phase1-partner');
    partnerBox.innerHTML = '';
    partnerBox.appendChild(makePortrait(s.char, 'partner-portrait hologram'));

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `<span class="bubble-name">${s.char.name}</span>「${s.hintText}」`;
    partnerBox.appendChild(bubble);

    // 候補地点は地図上のピンとして表示。全ピン同一の見た目・同一の
    // (結晶のない)地面に置き、正解を視覚的に匂わせない
    const box = $('#dig-map');
    box.innerHTML = '';
    SPOT_LABELS.forEach((label, i) => {
      const pos = CONFIG.DIG_MAP_PIN_POSITIONS[i] || { x: 50, y: 50 };
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'pin-anchor drop';
      pin.style.left = pos.x + '%';
      pin.style.top = pos.y + '%';
      pin.style.animationDelay = `${i * 0.08}s`;
      pin.innerHTML =
        '<span class="pin-shadow"></span>' +
        `<span class="pin-shape"><span class="pin-label">${label}</span></span>`;
      pin.addEventListener('click', () => {
        s.chosenSpot = label;
        box.querySelectorAll('.pin-anchor').forEach((b) => b.classList.remove('selected'));
        pin.classList.add('selected');
        $('#btn-dig').disabled = false;
        this.showReaction(s);
      });
      box.appendChild(pin);
    });

    $('#spot-reaction').classList.add('hidden');
    $('#btn-dig').disabled = true;
  },

  // 地点選択直後・確定前に相棒が一言だけ挟む(正解地点はここでは一切参照しない)
  showReaction(s) {
    const line = Game.spotReactionLine(s.char, s.chosenSpot, s.hintSpot);
    const el = $('#spot-reaction');
    el.innerHTML = `<span class="bubble-name">${s.char.name}</span>「${line}」`;
    el.classList.remove('hidden', 'show');
    void el.offsetWidth; // 選び直すたびにアニメーションを再生し直す
    el.classList.add('show');
  },
};

// ---- 採掘 フェーズ2(呼吸合わせ) ------------------------------
const Phase2Screen = {
  pos: 0,
  dir: 1,
  running: false,
  rafId: null,
  lastTime: null,

  enter() {
    const s = Game.session;
    s.taps = [];

    const partnerBox = $('#phase2-partner');
    partnerBox.innerHTML = '';
    partnerBox.appendChild(makePortrait(s.char, 'partner-portrait small hologram'));

    // ゾーン幅を定数から反映
    const zone = $('#zone');
    zone.style.width = CONFIG.ZONE_WIDTH * 100 + '%';
    zone.style.left = (0.5 - CONFIG.ZONE_WIDTH / 2) * 100 + '%';

    this.renderDots();
    $('#tap-feedback').innerHTML = '&nbsp;';
    $('#btn-tap').disabled = false;

    // キャラ別の呼吸(指示書追加分): 速度倍率+ゆらぎ。ゆらぎは滑らかな
    // sin波で表現し(毎フレームの乱数は使わない)、軽量かつ「揺れて見える」
    const breath = s.char.breath || { speedMul: 1, wobble: () => 0, style: 'default' };
    this.speedMul = breath.speedMul;
    this.wobbleAmt = breath.wobble(s.trust) || 0;
    this.wobbleFreq = 1.3 + Math.random() * 0.9;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.elapsed = 0;

    const dot = $('#breath-dot');
    dot.className = 'breath-dot style-' + (breath.style || 'default');
    dot.style.animationDuration = (2.1 / this.speedMul).toFixed(2) + 's';

    this.pos = 0;
    this.dir = 1;
    this.lastTime = null;
    this.inZone = false;
    zone.classList.remove('hot');
    this.running = true;
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  },

  leave() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  },

  loop(time) {
    if (!this.running) return;
    if (this.lastTime !== null) {
      const dt = (time - this.lastTime) / 1000;
      this.elapsed += dt;
      // 2.2%/frame(60fps基準)を時間ベースに換算 → リフレッシュレート非依存。
      // キャラ別の速度倍率+緩やかなsin波のゆらぎを掛け合わせる
      const baseSpeed = CONFIG.INDICATOR_SPEED_PER_FRAME * CONFIG.FPS_BASE * this.speedMul;
      const wobbleFactor = this.wobbleAmt
        ? 1 + Math.sin(this.elapsed * this.wobbleFreq + this.wobblePhase) * this.wobbleAmt
        : 1;
      const speed = baseSpeed * wobbleFactor;
      this.pos += this.dir * speed * dt;
      if (this.pos > 1) {
        this.pos = 2 - this.pos;
        this.dir = -1;
      } else if (this.pos < 0) {
        this.pos = -this.pos;
        this.dir = 1;
      }
    }
    this.lastTime = time;
    $('#marker').style.left = this.pos * 100 + '%';

    // ゾーン内に入った瞬間だけ帯を光らせる(タイミングの手応え)
    const inZone = Math.abs(this.pos - 0.5) <= CONFIG.ZONE_WIDTH / 2;
    if (inZone !== this.inZone) {
      this.inZone = inZone;
      $('#zone').classList.toggle('hot', inZone);
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  },

  tap() {
    const s = Game.session;
    if (!this.running || s.taps.length >= CONFIG.TAP_COUNT) return;

    const acc = Game.tapAccuracy(this.pos);
    s.taps.push(acc);
    this.renderDots();
    this.showFeedback(acc);
    this.swingMarker();
    this.reactBreath(acc);

    if (s.taps.length >= CONFIG.TAP_COUNT) {
      $('#btn-tap').disabled = true;
      this.running = false;
      cancelAnimationFrame(this.rafId);
      setTimeout(() => showScreen('result'), 900);
    }
  },

  // 相棒の呼吸ドット: タップ精度に応じてキャラ別の光り方/揺れ方をする
  reactBreath(acc) {
    const dot = $('#breath-dot');
    dot.classList.remove('pulse-success', 'pulse-miss');
    void dot.offsetWidth;
    dot.classList.add(acc >= 0.6 ? 'pulse-success' : 'pulse-miss');
  },

  // タップの瞬間、つるはしを傾けて発光させる(再タップ時も毎回頭から再生)
  swingMarker() {
    const marker = $('#marker');
    marker.classList.remove('swing');
    void marker.offsetWidth; // reflow でアニメーションを強制的にリスタート
    marker.classList.add('swing');
  },

  showFeedback(acc) {
    let text;
    if (acc >= 0.9) text = 'ピッタリ!';
    else if (acc >= 0.6) text = 'いい感じ';
    else if (acc >= 0.3) text = 'ちょいズレ…';
    else text = '全然合ってない…';
    const el = $('#tap-feedback');
    el.textContent = `${text}(精度${Math.round(acc * 100)}%)`;
    // アニメーションを付け直す
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  },

  renderDots() {
    const s = Game.session;
    const box = $('#tap-dots');
    box.innerHTML = '';
    for (let i = 0; i < CONFIG.TAP_COUNT; i++) {
      const dot = document.createElement('span');
      dot.className = 'tap-dot';
      if (i < s.taps.length) {
        dot.classList.add('done');
        dot.textContent = Math.round(s.taps[i] * 100);
      } else {
        dot.textContent = '·';
      }
      box.appendChild(dot);
    }
  },
};

// ---- 精算 ------------------------------------------------------
const ResultScreen = {
  enter() {
    const result = Game.settle();
    // ウォレット・記録に積むのはプレイヤーの取り分のみ(相棒の分は渡した扱い)
    const isNewBest = Storage.recordSession(
      result.char.id,
      result.playerShare,
      result.sync
    );

    const body = $('#result-body');
    body.innerHTML = '';

    const spotLine = document.createElement('p');
    spotLine.className = 'result-spot ' + (result.hit ? 'hit' : 'miss');
    spotLine.textContent = result.hit
      ? `${result.chosenSpot}地点 —— 当たり!`
      : `${result.chosenSpot}地点はハズレ…(正解は${result.correctSpot}地点)`;
    body.appendChild(spotLine);

    // シンクロ率からランクを算出(見た目の評価。計算には影響しない)
    const rank =
      result.sync >= 90 ? 'S' :
      result.sync >= 80 ? 'A' :
      result.sync >= 60 ? 'B' : 'C';

    // 獲得量: 合計をカウントアップしたあと、山分けの内訳を左右に開く
    const gain = document.createElement('div');
    gain.className = 'result-gain';
    gain.innerHTML =
      '<span class="result-gain-label">掘り出した共鳴石(合計)</span>' +
      `<strong><span class="gem big"></span><span id="gain-count">+0</span></strong>` +
      '<div class="split-row">' +
        '<div class="split-side">' +
          '<span class="split-label">あなた</span>' +
          `<span class="split-amount" id="split-you">+0</span>` +
        '</div>' +
        '<span class="split-divider">⇄</span>' +
        '<div class="split-side">' +
          `<span class="split-label">${result.char.name}</span>` +
          `<span class="split-amount" id="split-partner">+0</span>` +
        '</div>' +
      '</div>';
    body.appendChild(gain);
    animateCount($('#gain-count'), result.gain, { prefix: '+' });
    // 合計のカウントアップが落ち着いた頃合いで、山分けの内訳を見せる
    setTimeout(() => {
      gain.querySelector('.split-row').classList.add('show');
      animateCount($('#split-you'), result.playerShare, { prefix: '+', duration: 450 });
      animateCount($('#split-partner'), result.partnerShare, { prefix: '+', duration: 450 });
    }, 650);

    // シンクロ率: アニメーションするバー+ランクスタンプ
    // (ランクは呼吸合わせの評価なのでこちらに載せる。地点のハズレとは独立)
    const sync = document.createElement('div');
    sync.className = 'sync-wrap';
    sync.innerHTML =
      `<div class="sync-head"><span>シンクロ率${
        isNewBest && result.sync > 0 ? ' <em class="sync-best">☆自己ベスト!</em>' : ''
      }</span><strong>${result.sync}%</strong></div>` +
      '<div class="sync-bar"><i></i></div>' +
      `<span class="rank-stamp rank-${rank.toLowerCase()}">${rank}</span>`;
    body.appendChild(sync);
    // 挿入後の次フレームで幅を入れ、CSSトランジションで伸ばす
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        sync.querySelector('.sync-bar i').style.width = result.sync + '%';
      })
    );

    const partnerRow = document.createElement('div');
    partnerRow.className = 'partner-row';
    partnerRow.appendChild(makePortrait(result.char, 'partner-portrait hologram'));
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `<span class="bubble-name">${result.char.name}</span>「${result.line}」`;
    partnerRow.appendChild(bubble);
    body.appendChild(partnerRow);

    const wallet = document.createElement('p');
    wallet.className = 'result-wallet';
    wallet.innerHTML =
      `手持ちの共鳴石 <span class="gem"></span><strong>${fmt(Storage.data.totalResonance)}</strong>`;
    body.appendChild(wallet);
  },
};

// ---- 憑依トランジション演出 ------------------------------------
// 魂が立ち絵に飛び込む(三人称) → 白フラッシュ →
// まぶたが開いて坑道が見える(一人称)。タップでスキップ可
const PossessionFX = {
  active: false,
  timers: [],
  anims: [],

  play(char) {
    if (this.active) return;

    // OSの「視差効果を減らす」設定時は演出を省略
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showScreen('phase1');
      return;
    }

    this.active = true;
    const ov = $('#possession-overlay');
    ov.classList.remove('hidden', 'eyes');

    // 前回の状態をリセット
    const stage = ov.querySelector('.possession-stage');
    stage.classList.remove('hidden');
    const flash = ov.querySelector('.possession-flash');
    flash.style.opacity = 0;
    const text = ov.querySelector('.possession-text');
    text.textContent = '';
    ov.querySelectorAll('.eyelid').forEach((l) =>
      l.classList.remove('closed', 'open')
    );

    const pbox = $('#possession-portrait');
    pbox.innerHTML = '';
    const portrait = makePortrait(char, 'possession-portrait-img');
    pbox.appendChild(portrait);

    const orb = ov.querySelector('.soul-orb');
    orb.style.opacity = 1;

    const t = (fn, ms) => this.timers.push(setTimeout(fn, ms));

    // 魂の飛翔: 立ち絵までの距離を実測して飛ばす(ビューポート差に強い)
    requestAnimationFrame(() => {
      if (!this.active) return;
      const or = orb.getBoundingClientRect();
      const pr = portrait.getBoundingClientRect();
      const dy = pr.top + pr.height / 2 - (or.top + or.height / 2);
      this.anims.push(
        orb.animate(
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: `translateY(${dy}px) scale(0.4)` },
          ],
          { duration: 650, easing: 'cubic-bezier(0.4, 0.1, 0.7, 1)', fill: 'forwards' }
        )
      );
    });

    // 着弾: 発光+震え
    t(() => {
      orb.style.opacity = 0;
      portrait.classList.add('hit');
      text.textContent = 'シンクロ中……';
    }, 650);

    // 白フラッシュ
    t(() => {
      flash.style.opacity = 1;
    }, 1200);

    // フラッシュの裏で: フェーズ1に切替、まぶたを閉じ、ステージを消す
    t(() => {
      showScreen('phase1');
      stage.classList.add('hidden');
      ov.classList.add('eyes');
      ov.querySelectorAll('.eyelid').forEach((l) => l.classList.add('closed'));
      flash.style.opacity = 0;
      text.textContent = '憑依完了';
    }, 1400);

    // まぶたが開く+視界のピントが合う
    // (「憑依完了」は暗いまぶたの上でだけ見せ、開眼と同時に消す)
    t(() => {
      text.textContent = '';
      ov.querySelectorAll('.eyelid').forEach((l) => l.classList.add('open'));
      document.getElementById('app').classList.add('waking');
    }, 1850);

    t(() => this.finish(), 2600);
  },

  // 途中スキップ(オーバーレイをタップ)
  skip() {
    if (!this.active) return;
    if (currentScreen !== 'phase1') showScreen('phase1');
    this.finish();
  },

  finish() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.anims.forEach((a) => a.cancel());
    this.anims = [];
    $('#possession-overlay').classList.add('hidden');
    this.active = false;
    const app = document.getElementById('app');
    setTimeout(() => app.classList.remove('waking'), 900);
  },
};
