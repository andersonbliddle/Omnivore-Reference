(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.OmnivoreSession = api; } })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function getEnabledImages(collections) {
    const all = [];
    collections.filter(c => c.enabled).forEach(c => all.push(...c.images));
    return all;
  }

  function shuffle(array, random = Math.random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function pickSessionImages(images, count, random = Math.random) {
    return shuffle(images, random).slice(0, count);
  }

  return { getEnabledImages, shuffle, pickSessionImages };
});
