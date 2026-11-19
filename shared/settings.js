(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.OmnivoreSettings = api; } })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_SETTINGS = {
    collections: [],
    timerDuration: 60,
    sessionLength: 10,
    windowBounds: { width: 1200, height: 800 },
    hasSeenTutorial: false
  };

  function mergeWithDefaults(parsed) {
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { ...structuredClone(DEFAULT_SETTINGS), ...parsed };
    }
    return structuredClone(DEFAULT_SETTINGS);
  }

  function parseSettings(text) {
    try { return mergeWithDefaults(JSON.parse(text)); } catch { return structuredClone(DEFAULT_SETTINGS); }
  }

  return { DEFAULT_SETTINGS, mergeWithDefaults, parseSettings };
});
