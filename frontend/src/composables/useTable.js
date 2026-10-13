import { ref, computed, unref, watch } from 'vue';

// Pure-reactive table state: search, sort, pagination -- no DOM manipulation,
// no destroy/rebuild. Replaces the old jQuery DataTables wrapper
// (useDataTable.js), which destroyed and reinitialized the whole table on
// every data change, silently resetting the page/sort/search the user had
// set. Here state lives in refs and simply recomputes, so it survives data
// changes untouched (only clamped if the current page no longer exists).
//
// `columns` accepts an optional `sortValue(row)` per column so sorting can
// use the row's real value (e.g. a status enum's semantic order, or a
// name field inside a combined "Nama / NIP" cell) instead of scraping
// rendered DOM text the way DataTables did.
export function useTable(rowsSource, { columns = [], pageSize: initialPageSize = 10, searchFields = null } = {}) {
  const search = ref('');
  const sortKey = ref(null);
  const sortDir = ref('asc');
  const page = ref(1);
  const pageSize = ref(initialPageSize);

  function searchableText(row) {
    const keys = searchFields || Object.keys(row);
    return keys.map((k) => {
      const v = row[k];
      return v == null || typeof v === 'object' ? '' : String(v);
    }).join(' ').toLowerCase();
  }

  const filtered = computed(() => {
    const rows = unref(rowsSource) || [];
    const q = search.value.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchableText(r).includes(q));
  });

  const sorted = computed(() => {
    const rows = filtered.value;
    if (!sortKey.value) return rows;
    const col = columns.find((c) => c.key === sortKey.value);
    const getValue = col?.sortValue || ((row) => row[sortKey.value]);
    const dir = sortDir.value === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'id') * dir;
    });
  });

  const totalItems = computed(() => sorted.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
  const currentPage = computed(() => Math.min(page.value, totalPages.value));

  const pageRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return sorted.value.slice(start, start + pageSize.value);
  });

  watch(search, () => { page.value = 1; });
  watch(pageSize, () => { page.value = 1; });

  function toggleSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortDir.value = 'asc';
    }
  }

  function goToPage(p) { page.value = Math.min(Math.max(1, p), totalPages.value); }

  return {
    search, sortKey, sortDir, pageSize,
    page: currentPage, totalItems, totalPages,
    pageRows, toggleSort, goToPage,
  };
}
