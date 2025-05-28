import Tablesort from './tablesort.js';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = function(el, options) {
    return new Tablesort(el, options);
  }
}

if (typeof window !== 'undefined') {
  window.Tablesort = Tablesort;
}