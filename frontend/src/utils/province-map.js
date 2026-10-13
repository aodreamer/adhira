export function normalizeProvinceName(value) {
  const name = String(value || '').trim().toUpperCase().replace(/\s+/g, ' ').replace(/^PROVINSI\s+/, '');
  const aliases = {
    'DI YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
    'D.I. YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
    'D.I YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
    'DAERAH KHUSUS IBUKOTA JAKARTA': 'DKI JAKARTA',
    'D.K.I. JAKARTA': 'DKI JAKARTA',
    'D.K.I JAKARTA': 'DKI JAKARTA',
    'NANGGROE ACEH DARUSSALAM': 'ACEH',
    'BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
    'KEP. BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
    'KEP. RIAU': 'KEPULAUAN RIAU',
  };
  return aliases[name] || name;
}

const metrics = ['total', 'sesuai', 'menunggu', 'perbaikan', 'draft', 'sk_tersedia'];
const emptyCounts = () => Object.fromEntries(metrics.map(key => [key, 0]));
export function buildProvinceMap(provinces, rows = []) {
  const regions = provinces.map(province => ({ ...province, ...emptyCounts() }));
  const lookup = new Map(regions.map(region => [normalizeProvinceName(region.name), region]));
  const unmapped = emptyCounts();
  const unmatchedNames = new Set();
  for (const row of rows) {
    const name = normalizeProvinceName(row.provinsi);
    const region = lookup.get(name);
    const target = region || unmapped;
    if (name && !region) unmatchedNames.add(row.provinsi);
    for (const key of metrics) target[key] += Number(row[key]) || 0;
  }
  return { regions, unmapped, unmatchedNames: [...unmatchedNames].sort() };
}
