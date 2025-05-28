const cleanNumber = function(i) {
  return i.replace(/[^\-?0-9.]/g, '');
}

const compareNumber = function(a, b) {
  a = parseFloat(a);
  b = parseFloat(b);

  a = isNaN(a) ? 0 : a;
  b = isNaN(b) ? 0 : b;

  return a - b;
};

const plugin = {
  name: 'number',
  pattern: function(item) {
    return item.match(/^[-+]?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/) || // Prefixed currency
      item.match(/^[-+]?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/) || // Suffixed currency
      item.match(/^[-+]?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/); // Number
  },
  sort: function(a, b) {
    a = cleanNumber(a);
    b = cleanNumber(b);

    return compareNumber(b, a);
  }
}

if (typeof window.Tablesort !== 'undefined') {
  Tablesort.extend(plugin.name, plugin.pattern, plugin.sort);
}

export default plugin;
