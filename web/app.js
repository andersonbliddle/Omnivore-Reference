document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  document.body.dataset.shared = typeof OmnivoreFilters === 'object' ? 'loaded' : 'missing';
  fetch('/api/health')
    .then((res) => res.json())
    .then((data) => {
      status.textContent = data.ok === true ? 'Server OK' : 'Server error';
    })
    .catch(() => {
      status.textContent = 'Server unreachable';
    });
});
