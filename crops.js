/* ============================================================
   FARMSPHERICA — crops.js
   Search + filter logic for crops.html
   Depends on app.js being loaded first (for filter-tab base)
   ============================================================ */

(function () {
  'use strict';

  const searchInput  = document.getElementById('cropSearch');
  const searchClear  = document.getElementById('searchClear');
  const cropsGrid    = document.getElementById('cropsGrid');
  const noResults    = document.getElementById('noResults');
  const visibleCount = document.getElementById('visibleCount');
  const filterTabs   = document.querySelectorAll('.filter-tab');

  if (!searchInput || !cropsGrid) return;

  const allCards = Array.from(cropsGrid.querySelectorAll('.crop-card'));

  // Track current active filter
  let activeFilter = 'all';

  /* ── Update count display ── */
  function updateCount() {
    const visible = allCards.filter(c => c.style.display !== 'none').length;
    if (visibleCount) visibleCount.textContent = visible;
    if (noResults) noResults.style.display = visible === 0 ? 'flex' : 'none';
  }

  /* ── Filter + search combined ── */
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();

    allCards.forEach((card, i) => {
      const category = card.getAttribute('data-category');
      const name     = (card.getAttribute('data-name') || '').toLowerCase();
      const bodyText = card.querySelector('.crop-card-body')?.textContent.toLowerCase() || '';

      const matchesFilter = activeFilter === 'all' || category === activeFilter;
      const matchesSearch = !query || name.includes(query) || bodyText.includes(query);

      if (matchesFilter && matchesSearch) {
        card.style.display = '';
        // Stagger re-reveal
        card.classList.remove('visible');
        setTimeout(() => card.classList.add('visible'), i * 40);
      } else {
        card.style.display = 'none';
        card.classList.remove('visible');
      }
    });

    updateCount();
  }

  /* ── Search input ── */
  searchInput.addEventListener('input', () => {
    const hasValue = searchInput.value.length > 0;
    if (searchClear) searchClear.classList.toggle('visible', hasValue);
    applyFilters();
  });

  /* ── Clear button ── */
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.remove('visible');
      searchInput.focus();
      applyFilters();
    });
  }

  /* ── Filter tabs ── */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-filter');
      applyFilters();
    });
  });

  /* ── Initial count on load ── */
  updateCount();

  /* ── Keyboard: Escape clears search ── */
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      if (searchClear) searchClear.classList.remove('visible');
      applyFilters();
      searchInput.blur();
    }
  });

})();