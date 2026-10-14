const { aggregateProvinces } = require('../utils/executive-province');

// Aggregate only: names, employee numbers, and document paths never leave this query.
const BASE = `WITH records AS (
  SELECT periode_id, COALESCE(tgl_upload, created_at::date) AS recorded_on,
    COALESCE(NULLIF(BTRIM(instansi), ''), 'Belum diisi') AS instansi,
    COALESCE(NULLIF(BTRIM(jenis_penghargaan), ''), 'Belum dipilih') AS jenis,
    NULLIF(UPPER(BTRIM(pemda_provinsi)), '') AS provinsi,
    NULLIF(UPPER(BTRIM(pemda_kabkota)), '') AS kabkota,
    CASE WHEN verifikasi_data_status IN ('Disetujui','Ditolak','Menunggu') THEN verifikasi_data_status
      WHEN verifikasi_data_status IS NULL THEN 'Menunggu' ELSE 'Lainnya' END AS status_data,
    CASE WHEN verifikasi_berkas_status IN ('Disetujui','Ditolak','Menunggu') THEN verifikasi_berkas_status
      WHEN verifikasi_berkas_status IS NULL THEN 'Menunggu' ELSE 'Lainnya' END AS status_berkas,
    CASE
      WHEN instansi = 'Pemerintah Pusat' AND NULLIF(BTRIM(nama_instansi), '') IS NOT NULL
        THEN 'Pemerintah Pusat — ' || BTRIM(nama_instansi)
      WHEN instansi = 'Pemerintah Daerah' AND NULLIF(BTRIM(pemda_provinsi), '') IS NOT NULL
        THEN concat_ws(' — ', NULLIF(BTRIM(pemda_tipe), ''),
          NULLIF(BTRIM(pemda_kabkota), ''), BTRIM(pemda_provinsi))
      ELSE COALESCE(NULLIF(BTRIM(instansi), ''), 'Belum diisi')
    END AS instansi_label,
    CASE
      WHEN verifikasi_data_status = 'Ditolak' OR verifikasi_berkas_status = 'Ditolak' THEN 'perbaikan'
      WHEN verifikasi_data_status = 'Disetujui' AND verifikasi_berkas_status = 'Disetujui' THEN 'sesuai'
      WHEN jenis_penghargaan IS NULL OR BTRIM(jenis_penghargaan) IN ('', 'Sedang Diajukan') THEN 'draft'
      WHEN COALESCE(verifikasi_data_status, 'Menunggu') <> 'Disetujui' THEN 'verifikasi_data'
      ELSE 'verifikasi_berkas'
    END AS tahap,
    NULLIF(BTRIM(file_kepka), '') IS NOT NULL AS sk_tersedia
  FROM data_individu
), filtered AS (
  SELECT * FROM records WHERE
    ($1::int IS NULL OR EXTRACT(YEAR FROM recorded_on) = $1)
    AND ($2::text IS NULL OR instansi = $2)
    AND ($3::text IS NULL OR jenis = $3)
    AND ($4::int IS NULL OR periode_id = $4)
)`;

const COUNTS = `COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE tahap = 'sesuai')::int AS sesuai,
  COUNT(*) FILTER (WHERE tahap = 'perbaikan')::int AS perbaikan,
  COUNT(*) FILTER (WHERE tahap IN ('verifikasi_data', 'verifikasi_berkas'))::int AS menunggu,
  COUNT(*) FILTER (WHERE tahap = 'draft')::int AS draft,
  COUNT(*) FILTER (WHERE sk_tersedia)::int AS sk_tersedia`;

const ATTENTION = `COUNT(*) FILTER (WHERE tahap IN ('verifikasi_data','verifikasi_berkas') AND recorded_on <= CURRENT_DATE - 30)::int AS menunggu_30_hari,
  COUNT(*) FILTER (WHERE tahap = 'sesuai' AND NOT sk_tersedia)::int AS sesuai_tanpa_sk`;

async function loadExecutiveDashboard(pool, filters) {
  const client = await pool.connect();
  const params = [filters.tahun, filters.instansi, filters.jenis, filters.periode_id ?? null];
  try {
    // All panels and exports describe the same snapshot, even during verification.
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const options = await client.query(`${BASE} SELECT CURRENT_DATE::text AS as_of_date,
      ARRAY(SELECT DISTINCT EXTRACT(YEAR FROM recorded_on)::int FROM records WHERE recorded_on IS NOT NULL ORDER BY 1 DESC) AS tahun,
      ARRAY(SELECT DISTINCT instansi FROM records ORDER BY instansi) AS instansi,
      ARRAY(SELECT DISTINCT jenis FROM records ORDER BY jenis) AS jenis`, params);
    const summary = await client.query(`${BASE} SELECT ${COUNTS}, ${ATTENTION},
      COUNT(*) FILTER (WHERE instansi = 'Belum diisi')::int AS instansi_kosong,
      COUNT(*) FILTER (WHERE recorded_on IS NULL)::int AS tanggal_kosong,
      COUNT(DISTINCT instansi_label) FILTER (WHERE instansi <> 'Belum diisi')::int AS instansi_tercakup
      FROM filtered`, params);
    const stages = await client.query(`${BASE} SELECT tahap, COUNT(*)::int AS jumlah FROM filtered GROUP BY tahap`, params);
    const trend = await client.query(`${BASE} SELECT
      to_char(recorded_on, $5::text) AS periode, ${COUNTS}
      FROM filtered WHERE recorded_on IS NOT NULL GROUP BY periode ORDER BY periode`,
      [...params, filters.tahun ? 'YYYY-MM' : 'YYYY']);
    const kinds = await client.query(`${BASE} SELECT jenis, COUNT(*)::int AS jumlah FROM filtered GROUP BY jenis ORDER BY jumlah DESC, jenis`, params);
    const institutions = await client.query(`${BASE} SELECT instansi_label AS instansi, ${COUNTS}, ${ATTENTION}
      FROM filtered GROUP BY instansi_label ORDER BY (COUNT(*) FILTER (WHERE tahap <> 'sesuai')) DESC, instansi_label`, params);
    const provinces = await client.query(`${BASE} SELECT instansi, provinsi, kabkota, ${COUNTS}
      FROM filtered GROUP BY instansi, provinsi, kabkota`, params);
    const age = await client.query(`${BASE} SELECT CASE
      WHEN recorded_on IS NULL THEN 'unknown'
      WHEN recorded_on > CURRENT_DATE THEN 'future'
      WHEN CURRENT_DATE - recorded_on <= 7 THEN '0-7'
      WHEN CURRENT_DATE - recorded_on <= 14 THEN '8-14'
      WHEN CURRENT_DATE - recorded_on <= 29 THEN '15-29'
      WHEN CURRENT_DATE - recorded_on <= 59 THEN '30-59'
      ELSE '60+' END AS kelompok, COUNT(*)::int AS jumlah
      FROM filtered WHERE tahap IN ('verifikasi_data','verifikasi_berkas') GROUP BY kelompok`, params);
    const matrix = await client.query(`${BASE} SELECT status_data, status_berkas, COUNT(*)::int AS jumlah
      FROM filtered GROUP BY status_data, status_berkas`, params);
    await client.query('COMMIT');
    const {as_of_date,...filterOptions}=options.rows[0];
    return {
      updated_at: new Date().toISOString(),
      as_of_date, filters, options: filterOptions, summary: summary.rows[0],
      stages: stages.rows, trend: trend.rows, kinds: kinds.rows, institutions: institutions.rows, provinces: aggregateProvinces(provinces.rows),
      waiting_age: age.rows, verification_matrix: matrix.rows,
      trend_unit: filters.tahun ? 'bulan' : 'tahun',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
}

module.exports = { loadExecutiveDashboard };
