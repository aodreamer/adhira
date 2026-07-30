import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Alert terpusat bergaya SweetAlert, dipakai menggantikan banner teks
// error/sukses biasa supaya feedback ke user lebih terasa dan jelas. Class
// Tailwind ditulis literal (bukan digabung dinamis) di sini supaya tetap
// ikut di-scan JIT Tailwind (tailwind.config.js content meng-include *.js
// di src/), meski dipakai lewat innerHTML/customClass, bukan template .vue.
const baseConfig = {
  confirmButtonColor: '#059669',
  customClass: {
    popup: 'rounded-2xl',
    title: 'text-lg font-bold text-gray-800',
    confirmButton: '!rounded-xl !px-5 !py-2.5 !text-sm !font-medium !shadow-sm',
    cancelButton: '!rounded-xl !px-5 !py-2.5 !text-sm !font-medium !shadow-sm',
  },
};

export function useAlert() {
  function alertSuccess(title, text) {
    return Swal.fire({ ...baseConfig, icon: 'success', title, text, timer: 2500, showConfirmButton: false });
  }

  function alertError(title, text) {
    return Swal.fire({ ...baseConfig, icon: 'error', title, text, confirmButtonColor: '#dc2626' });
  }

  function alertWarning(title, text) {
    return Swal.fire({ ...baseConfig, icon: 'warning', title, text, confirmButtonColor: '#d97706' });
  }

  // Modal SweetAlert untuk memilih berkas (+ judul opsional) sekaligus --
  // dipakai halaman Upload Berkas supaya "nama" (judul) dan file ditanyakan
  // dalam satu dialog, bukan input terpisah di kartu.
  async function promptFileUpload({ title, titleLabel, currentTitle = '', accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg', maxSizeMB = 2 }) {
    const acceptList = accept.split(',');
    const { value } = await Swal.fire({
      ...baseConfig,
      title,
      width: 620,
      padding: '2rem 2.25rem 1.75rem',
      html: `
        <div class="text-left space-y-5 mt-3">
          ${titleLabel ? `
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">${titleLabel} <span class="text-red-500">*</span></label>
              <input id="swal-judul" type="text" placeholder="mis. Keputusan Bupati ... tentang ... tahun ..." value="${currentTitle.replace(/"/g, '&quot;')}"
                class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500" />
              <p class="text-xs text-gray-400 mt-1.5">Judul lengkap surat/keputusan yang tercantum pada berkas.</p>
            </div>
          ` : ''}
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Berkas <span class="text-red-500">*</span></label>
            <label id="swal-dropzone" for="swal-file" class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl px-4 py-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition">
              <svg id="swal-dropzone-icon" class="w-9 h-9 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"/></svg>
              <span id="swal-file-label" class="text-sm font-medium text-gray-600">Klik atau seret berkas ke sini</span>
              <span class="text-xs text-gray-400">PDF, DOC, DOCX, PNG, atau JPG — maksimal ${maxSizeMB}MB</span>
            </label>
            <input id="swal-file" type="file" accept="${accept}" class="hidden" />
          </div>
        </div>
      `,
      didOpen: () => {
        const fileInput = document.getElementById('swal-file');
        const fileLabel = document.getElementById('swal-file-label');
        const dropzone = document.getElementById('swal-dropzone');
        const highlight = ['border-emerald-400', 'bg-emerald-50/60'];

        function setFile(f) {
          if (!f) return;
          const dt = new DataTransfer();
          dt.items.add(f);
          fileInput.files = dt.files;
          if (fileLabel) fileLabel.textContent = f.name;
        }

        fileInput?.addEventListener('change', () => setFile(fileInput.files?.[0]));

        if (dropzone) {
          ['dragenter', 'dragover'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add(...highlight);
          }));
          ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove(...highlight);
          }));
          dropzone.addEventListener('drop', (e) => setFile(e.dataTransfer?.files?.[0]));
        }
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const judul = document.getElementById('swal-judul')?.value?.trim() || '';
        if (titleLabel && !judul) {
          Swal.showValidationMessage('Judul berkas wajib diisi');
          return false;
        }
        const file = document.getElementById('swal-file')?.files?.[0];
        if (!file) {
          Swal.showValidationMessage('Pilih berkas terlebih dahulu');
          return false;
        }
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!acceptList.includes(ext)) {
          Swal.showValidationMessage('Format berkas tidak didukung');
          return false;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          Swal.showValidationMessage(`Ukuran berkas melebihi ${maxSizeMB}MB`);
          return false;
        }
        return { file, judul };
      },
    });
    return value || null;
  }

  return { alertSuccess, alertError, alertWarning, promptFileUpload };
}
