// Dot separated values. E.g. IP addresses or version numbers.
const plugin = {
  name: 'dotsep',
  pattern: function(item) {
    return /^(\d+\.)+\d+$/.test(item);
  },
  sort: function(a, b) {
    a = a.split('.');
    b = b.split('.');

    for (let i = 0, len = a.length, ai, bi; i < len; i++) {
      ai = parseInt(a[i], 10);
      bi = parseInt(b[i], 10);

      if (ai === bi) continue;
      if (ai > bi) return -1;
      if (ai < bi) return 1;
    }

    return 0;
  }
}

if (typeof window.Tablesort !== 'undefined') {
  Tablesort.extend(plugin.name, plugin.pattern, plugin.sort);
}

export default plugin;
