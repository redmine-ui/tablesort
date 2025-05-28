const plugin = {
  name: 'monthname',
  pattern: function(item) {
    return (
      item.search(/(January|February|March|April|May|June|July|August|September|October|November|December)/i) !== -1
    );
  },
  sort: function(a, b) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames.indexOf(b) - monthNames.indexOf(a);
  }
}

if (typeof window.Tablesort !== 'undefined') {
  Tablesort.extend(plugin.name, plugin.pattern, plugin.sort);
}

export default plugin;
