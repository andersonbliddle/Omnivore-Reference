(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.OmnivoreFilters = api; } })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function filterCollections(collections, { textFilter = '', useRegex = false, includeTags = [], excludeTags = [] } = {}) {
    let filtered = collections;
    const include = Array.from(includeTags);
    const exclude = Array.from(excludeTags);

    // Text filter first
    if (textFilter && textFilter.trim().length > 0) {
      if (useRegex) {
        try {
          const regex = new RegExp(textFilter, 'i');
          filtered = filtered.filter(c => regex.test(c.name));
        } catch (e) {
          // Invalid regex - fall back to substring search
          const t = textFilter.toLowerCase();
          filtered = filtered.filter(c => c.name.toLowerCase().includes(t));
        }
      } else {
        const t = textFilter.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(t));
      }
    }

    // Inclusion: all selected tags must be present
    if (include.length > 0) {
      filtered = filtered.filter(c => include.every(tag => (c.tags || []).includes(tag)));
    }

    // Exclusion: no excluded tag may be present
    if (exclude.length > 0) {
      filtered = filtered.filter(c => !exclude.some(tag => (c.tags || []).includes(tag)));
    }

    return filtered === collections ? [...collections] : filtered;
  }

  function collectTags(collections) {
    const tags = new Set();
    collections.forEach(c => {
      if (c.tags) c.tags.forEach(tag => tags.add(tag));
    });
    return tags;
  }

  return { filterCollections, collectTags };
});
