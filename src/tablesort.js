const sortOptions = [];

const createEvent = function (name) {
  if (!window.CustomEvent || typeof window.CustomEvent !== 'function') {
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(name, false, false, undefined);
    return evt;
  } else {
    return new CustomEvent(name);
  }
};

const getInnerText = function(el, options) {
  const sortAttribute = options.sortAttribute || 'data-sort';
  if (el.hasAttribute(sortAttribute)) {
    return el.getAttribute(sortAttribute);
  }
  return el.textContent || el.innerText || '';
};

// Default sort method if no better sort method is found
const caseInsensitiveSort = function (a, b) {
  a = a.trim().toLowerCase();
  b = b.trim().toLowerCase();

  if (a === b) return 0;
  if (a < b) return 1;

  return -1;
};

const getCellByKey = function (cells, key) {
  return [].slice.call(cells).find(function (cell) {
    return cell.getAttribute('data-sort-column-key') === key;
  });
};

// Stable sort function
// If two elements are equal under the original sort function,
// then there relative order is reversed
const stabilize = function (sort, antiStabilize) {
  return function (a, b) {
    const unstableResult = sort(a.td, b.td);

    if (unstableResult === 0) {
      if (antiStabilize) return b.index - a.index;
      return a.index - b.index;
    }

    return unstableResult;
  };
};

export default class Tablesort {
  static extend(name, pattern, sort) {
    if (typeof pattern !== 'function' || typeof sort !== 'function') {
      throw new Error('Pattern and sort must be a function');
    }

    sortOptions.push({
      name: name,
      pattern: pattern,
      sort: sort
    })
  }

  constructor(el, options) {
    if (!el || el.tagName !== 'TABLE') {
      throw new Error('Element must be a table');
    }

    this.table = el;
    this.thead = false;
    this.options = options || {};

    const firstRow = this.getFirstRow(el);
    if (!firstRow) return;

    const defaultSort = this.getDefaultSort(firstRow);

    if (defaultSort) {
      this.current = defaultSort;
      this.sortTable(defaultSort);
    }
  }

  getFirstRow(el) {
    let firstRow;
    if (el.rows && el.rows.length > 0) {
      if (el.tHead && el.tHead.rows.length > 0) {
        for (let i = 0; i < el.tHead.rows.length; i++) {
          if (el.tHead.rows[i].getAttribute('data-sort-method') === 'thead') {
            firstRow = el.tHead.rows[i];
            break;
          }
        }
        if (!firstRow) {
          firstRow = el.tHead.rows[el.tHead.rows.length - 1];
        }
        this.thead = true;
      } else {
        firstRow = el.rows[0];
      }
    }
    return firstRow;
  }

  getDefaultSort(firstRow) {
    const onClick = (e) => {
      if (this.current && this.current !== e.target) {
        this.current.removeAttribute('aria-sort');
      }

      this.current = e.target;
      this.sortTable(e.target);
    };

    let defaultSort;
    // Assume first row is the header and attach a click handler to each.
    for (let i = 0; i < firstRow.cells.length; i++) {
      const cell = firstRow.cells[i];
      cell.setAttribute('role', 'columnheader');
      if (cell.getAttribute('data-sort-method') !== 'none') {
        cell.tabIndex = 0;
        cell.addEventListener('click', onClick, false);

        cell.addEventListener('keydown', function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            onClick(event);
          }
        });

        if (cell.getAttribute('data-sort-default') !== null) {
          defaultSort = cell;
        }
      }
    }
    return defaultSort;
  }

  sortTable(header, update) {
    let columnKey = header.getAttribute('data-sort-column-key'),
      column = header.cellIndex,
      sortFunction = caseInsensitiveSort,
      item = '',
      items = [],
      i = this.thead ? 0 : 1,
      sortMethod = header.getAttribute('data-sort-method'),
      sortReverse = header.hasAttribute('data-sort-reverse'),
      sortOrder = header.getAttribute('aria-sort');

    this.table.dispatchEvent(createEvent('beforeSort'));

    // If updating an existing sort, direction should remain unchanged.
    if (!update) {
      if (sortOrder === 'ascending') {
        sortOrder = 'descending';
      } else if (sortOrder === 'descending') {
        sortOrder = 'ascending';
      } else {
        sortOrder = !!this.options.descending != sortReverse ? 'descending' : 'ascending';
      }

      header.setAttribute('aria-sort', sortOrder);
    }

    if (this.table.rows.length < 2) return;

    // If we force a sort method, it is not necessary to check rows
    if (!sortMethod) {
      let cell;
      while (items.length < 3 && i < this.table.tBodies[0].rows.length) {
        if (columnKey) {
          cell = getCellByKey(this.table.tBodies[0].rows[i].cells, columnKey);
        } else {
          cell = this.table.tBodies[0].rows[i].cells[column];
        }

        // Treat missing cells as empty cells
        item = cell ? getInnerText(cell, this.options) : "";

        item = item.trim();

        if (item.length > 0) {
          items.push(item);
        }

        i++;
      }

      if (!items) return;
    }

    for (let i = 0; i < sortOptions.length; i++) {
      item = sortOptions[i];

      if (sortMethod) {
        if (item.name === sortMethod) {
          sortFunction = item.sort;
          break;
        }
      } else if (items.every(item.pattern)) {
        sortFunction = item.sort;
        break;
      }
    }

    this.col = column;

    for (let i = 0; i < this.table.tBodies.length; i++) {
      let newRows = [],
        noSorts = {},
        totalRows = 0,
        noSortsSoFar = 0;

      if (this.table.tBodies[i].rows.length < 2) continue;

      for (let j = 0; j < this.table.tBodies[i].rows.length; j++) {
        let cell;

        item = this.table.tBodies[i].rows[j];
        if (item.getAttribute('data-sort-method') === 'none') {
          // keep no-sorts in separate list to be able to insert
          // them back at their original position later
          noSorts[totalRows] = item;
        } else {
          if (columnKey) {
            cell = getCellByKey(item.cells, columnKey);
          } else {
            cell = item.cells[this.col];
          }
          // Save the index for stable sorting
          newRows.push({
            tr: item,
            td: cell ? getInnerText(cell, this.options) : '',
            index: totalRows
          });
        }
        totalRows++;
      }
      // Before we append should we reverse the new array or not?
      // If we reverse, the sort needs to be `anti-stable` so that
      // the double negatives cancel out
      if (sortOrder === 'descending') {
        newRows.sort(stabilize(sortFunction, true));
      } else {
        newRows.sort(stabilize(sortFunction, false));
        newRows.reverse();
      }

      // append rows that already exist rather than creating new ones
      for (let j = 0; j < totalRows; j++) {
        if (noSorts[j]) {
          // We have a no-sort row for this position, insert it here.
          item = noSorts[j];
          noSortsSoFar++;
        } else {
          item = newRows[j - noSortsSoFar].tr;
        }

        // appendChild(x) moves x if already present somewhere else in the DOM
        this.table.tBodies[i].appendChild(item);
      }
    }

    this.table.dispatchEvent(createEvent('afterSort'));
  }

  refresh() {
    if (this.current !== undefined) {
      this.sortTable(this.current, true);
    }
  }
}
