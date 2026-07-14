import { reactive } from 'vue';

// Shared modal state for FilePreviewModal.vue — keeps each view's template
// down to `openPreview(apiUrl, filename)` instead of managing its own
// show/apiUrl/filename refs.
export function useFilePreview() {
  const previewState = reactive({ show: false, apiUrl: '', filename: '' });

  function openPreview(apiUrl, filename) {
    previewState.apiUrl = apiUrl;
    previewState.filename = filename || 'berkas';
    previewState.show = true;
  }

  function closePreview() {
    previewState.show = false;
  }

  return { previewState, openPreview, closePreview };
}
