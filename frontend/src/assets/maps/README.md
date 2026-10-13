# Batas provinsi Indonesia

`indonesia-provinces.json` berisi 38 path SVG yang diturunkan dari polygon provinsi pada layanan Badan Informasi Geospasial:

https://geoservices.big.go.id/gis/rest/services/STIG/Batas_Provinsi/MapServer/0

Data diambil pada 13 Oktober 2026 melalui operasi Query dengan `where=1=1`, `outFields=KDPPUM,WADMPR`, `outSR=4326`, `maxAllowableOffset=0.02`, `geometryPrecision=4`, dan `f=geojson`. Nama provinsi dan kode berasal dari `WADMPR` dan `KDPPUM`. Kode dipakai untuk memilih geometri, bukan untuk mengonversi kode wilayah lama pada data pengguna.

Geometry diproyeksikan ke Mercator dan disederhanakan untuk visualisasi dashboard. Fragmen pulau yang lebih kecil dari 0,25 unit luas pada viewBox dihilangkan, dengan tetap mempertahankan polygon terbesar setiap provinsi. Asset berfungsi sebagai peta statistik, bukan rujukan penetapan batas wilayah. Atribusi Badan Informasi Geospasial ditampilkan pada komponen peta.

Geometry disimpan lokal sehingga tampilan tidak memerlukan API key, tile server, atau request ke layanan pihak ketiga saat pengguna membuka dashboard. Jumlah pengusul tetap bersumber dari API Adhira sesuai filter.
