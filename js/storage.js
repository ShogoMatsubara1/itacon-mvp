// ============================================================
// localStorageによる永続化(所持共鳴・関係記録)
// ============================================================
const Storage = {
  KEY: 'itacon_mvp_save_v1',
  data: null,

  defaultData() {
    const chars = {};
    CHARACTERS.forEach((c) => {
      chars[c.id] = { sessions: 0, totalGain: 0, bestSync: 0 };
    });
    return { totalResonance: 0, seenIntro: false, chars };
  },

  load() {
    this.data = this.defaultData();
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.totalResonance === 'number') {
          this.data.totalResonance = saved.totalResonance;
        }
        if (saved.seenIntro) {
          this.data.seenIntro = true;
        }
        CHARACTERS.forEach((c) => {
          const rec = saved.chars && saved.chars[c.id];
          if (rec) {
            this.data.chars[c.id] = {
              sessions: rec.sessions || 0,
              totalGain: rec.totalGain || 0,
              bestSync: rec.bestSync || 0,
            };
          }
        });
      }
    } catch (e) {
      // 壊れたデータは初期状態で上書き
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {
      // 保存不可(プライベートモード等)でもゲームは続行できる
    }
  },

  record(charId) {
    return this.data.chars[charId];
  },

  // オープニング(導入)を読了/スキップした。次回以降は受付から始まる
  markIntroSeen() {
    this.data.seenIntro = true;
    this.save();
  },

  // 精算時に呼ぶ。関係記録と所持共鳴を更新して保存
  recordSession(charId, gain, sync) {
    const rec = this.data.chars[charId];
    rec.sessions += 1;
    rec.totalGain += gain;
    const isNewBest = sync > rec.bestSync;
    if (isNewBest) rec.bestSync = sync;
    this.data.totalResonance += gain;
    this.save();
    return isNewBest;
  },
};
