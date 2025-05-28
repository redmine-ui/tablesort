const collator = Intl.Collator();

const plugin = {
  name: 'intl',
  pattern: _ => false,
  sort: (a,b) => collator.compare(b, a)
}

if (typeof window.Tablesort !== 'undefined') {
  Tablesort.extend(plugin.name, plugin.pattern, plugin.sort);
}

export default plugin;
