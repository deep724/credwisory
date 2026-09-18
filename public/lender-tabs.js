/* Category tabs for the public lender directory; comparison selection remains intact. */
(() => {
  const root = document.querySelector('.lender-page[data-lender-category="all"]');
  if (!root || root.dataset.tabsMounted) return;
  root.dataset.tabsMounted = 'true';
  const style = document.createElement('style');
  style.textContent = '.lc-tabs{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 16px}.lc-tabs button{min-height:38px;border:1px solid #dce5ed;border-radius:999px;background:#fff;padding:8px 14px;color:#102a52;font:800 .82rem Inter,system-ui,sans-serif;cursor:pointer}.lc-tabs button:hover,.lc-tabs button.active{border-color:#087f75;background:#e7f6f1;color:#087f75}.lc-tabs button:focus-visible{outline:3px solid #087f7560;outline-offset:2px}';
  document.head.append(style);
  const tabs = document.createElement('nav');
  tabs.className = 'lc-tabs'; tabs.setAttribute('aria-label', 'Lender categories');
  tabs.innerHTML = '<button class="active" data-category="all" type="button">All Lenders</button><button data-category="bank" type="button">Bank</button><button data-category="nbfc" type="button">NBFC</button><button data-category="international" type="button">International Lenders</button>';
  root.before(tabs); const requested = new URLSearchParams(location.search).get('category'); let category = ['bank', 'nbfc', 'international'].includes(requested) ? requested : 'all';
  const apply = () => root.querySelectorAll('tbody tr').forEach((row) => { row.hidden = category !== 'all' && row.dataset.lenderType !== category; });
  const select = (next) => { category = next; tabs.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item.dataset.category === category)); apply(); };
  tabs.addEventListener('click', (event) => { const button = event.target.closest('[data-category]'); if (!button) return; select(button.dataset.category || 'all'); });
  const classify = async () => { try { const response = await fetch('/api/lenders'); if (!response.ok) throw new Error(); const lenders = await response.json(); const types = new Map(lenders.map((lender) => [String(lender.slug || lender._id || ''), String(lender.lenderType).toLowerCase()])); root.querySelectorAll('tbody tr').forEach((row) => { const id = row.querySelector('input[data-id]')?.dataset.id || ''; row.dataset.lenderType = types.get(id) || ''; }); select(category); } catch { /* Table remains usable if filtering data fails. */ } };
  new MutationObserver(classify).observe(root, { childList: true, subtree: true }); classify();
})();
