const STORAGE_KEY = 'ascii-depths-data-v1';

const defaults = {
  highScores: [],
  stats: {
    totalGames: 0,
    totalKills: 0,
    deepestFloor: 0,
    mostGold: 0
  },
  settings: {
    scanlines: true,
    crt: true,
    mobileControls: 'auto',
    fontSize: 'medium',
    theme: 'green'
  }
};

export class Persistence {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw);
      return {
        highScores: Array.isArray(parsed.highScores) ? parsed.highScores.slice(0, 10) : [],
        stats: { ...defaults.stats, ...(parsed.stats || {}) },
        settings: { ...defaults.settings, ...(parsed.settings || {}) }
      };
    } catch {
      return structuredClone(defaults);
    }
  }

  save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getSettings() {
    return { ...this.data.settings };
  }

  updateSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
    return this.getSettings();
  }

  getHighScores() {
    return [...this.data.highScores];
  }

  getStats() {
    return { ...this.data.stats };
  }

  recordRun(run) {
    const entry = {
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      score: run.score,
      floor: run.floor,
      cause: run.cause,
      date: new Date().toISOString().slice(0, 10)
    };

    const stats = this.data.stats;
    stats.totalGames += 1;
    stats.totalKills += run.kills;
    stats.deepestFloor = Math.max(stats.deepestFloor, run.floor);
    stats.mostGold = Math.max(stats.mostGold, run.gold);

    const combined = [...this.data.highScores, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const kept = combined.some((row) => row.id === entry.id);
    this.data.highScores = combined;
    this.save();
    return kept ? entry.id : null;
  }
}
