/* API-backed lender directory with URL-based comparison handoff. */
(() => {
  const existing = window.CredwisoryLenderDirectory;
  const directory = existing || (() => {
    const fields = [
      ['Secured loan maximum', 'secured'],
      ['Unsecured loan maximum', 'unsecured'],
      ['Secured interest rate', 'securedRate'],
      ['Unsecured interest rate', 'unsecuredRate'],
      ['Moratorium period', 'moratorium'],
      ['Loan tenure', 'tenure'],
      ['Foreclosure charges', 'foreclosure'],
      ['Processing fees', 'fee'],
    ];
    const connected = (root) => root?.isConnected === true;
    const category = (value) => {
      const normalized = String(value || '').toLowerCase();
      return ['bank', 'nbfc', 'international', 'other'].includes(normalized) ? normalized : null;
    };
    const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 4).toUpperCase();
    const detail = (lender, key, fallback = 'Contact for details') => String(lender.comparison?.[key] ?? lender[key] ?? fallback);
    const display = (value) => value === 'Not available' ? '<span class="lc-na">Not available</span>' : value;
    const normalize = (lender) => {
      const type = category(lender.lenderType);
      return type ? {
        id: String(lender.slug || lender._id),
        type,
        initials: initials(lender.name),
        name: lender.name,
        logoUrl: lender.logoUrl || lender.logo || "",
        secured: detail(lender, 'secured'),
        unsecured: detail(lender, 'unsecured'),
        securedRate: detail(lender, 'securedRate', lender.securedRate || 'Contact for details'),
        unsecuredRate: detail(lender, 'unsecuredRate', lender.unsecuredRate || 'Contact for details'),
        moratorium: detail(lender, 'moratorium'),
        tenure: detail(lender, 'tenure', lender.tenure || 'Contact for details'),
        foreclosure: detail(lender, 'foreclosure'),
        fee: detail(lender, 'fee', lender.processingFee || 'Contact for details'),
      } : null;
    };
    const idsFromUrl = (items) => {
      const requested = new URLSearchParams(location.search).get('compare') || '';
      const valid = new Set(items.map((item) => item.id));
      return [...new Set(requested.split(',').map((value) => value.trim()).filter((value) => valid.has(value)))].slice(0, 4);
    };
    const markCompareScroll = (ids) => {
      try { sessionStorage.setItem('cw-lender-compare-scroll', ids.join(',')); } catch {}
    };
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const lenderLogo = (lender) => `<span data-lender-logo-slot data-logo-name="${escape(lender.name)}" data-logo-slug="${escape(lender.id)}" data-logo-url="${escape(lender.logoUrl)}"></span>`;
    const rateMarkup = (lender) => `<div class="lc-rate-list"><span><small>Secured</small><b>${display(lender.securedRate)}</b></span><span><small>Unsecured</small><b>${display(lender.unsecuredRate)}</b></span></div>`;
    const termsMarkup = (lender) => `<dl class="lc-terms"><div><dt>Moratorium</dt><dd>${display(lender.moratorium)}</dd></div><div><dt>Tenure</dt><dd>${display(lender.tenure)}</dd></div><div><dt>Foreclosure</dt><dd>${display(lender.foreclosure)}</dd></div><div><dt>Fees</dt><dd>${display(lender.fee)}</dd></div></dl>`;

    function render(root, lenders) {
      if (!connected(root)) return;
      const kind = root.dataset.lenderCategory || 'all';
      const comparePage = kind === 'all';
      root.classList.toggle('lc-compare-directory', comparePage);
      const items = comparePage ? lenders : lenders.filter((lender) => lender.type === kind);
      if (!items.length) {
        root.innerHTML = `<p class="lc-empty" role="status">No published ${comparePage ? 'lenders' : `${kind} lenders`} are available right now.</p>`;
        return;
      }

      let selected = comparePage ? idsFromUrl(items) : [];
      root.innerHTML = `
        <div class="lc-toolbar">
          <div>
            <p class="lc-count" aria-live="polite"><span>0</span> of 4 lenders selected</p>
            <p class="lc-selection-message" role="status" aria-live="polite" hidden></p>
          </div>
          <button class="lc-compare" type="button" disabled>Compare selected lenders</button>
        </div>
        <div class="lc-scroll" tabindex="0" aria-label="Education loan lenders">
          <table>
            <colgroup>
              <col class="lc-col-lender"><col class="lc-col-loan"><col class="lc-col-loan">
              <col class="lc-col-rates"><col class="lc-col-terms"><col class="lc-col-compare"><col class="lc-col-action">
            </colgroup>
            <thead><tr>${comparePage
              ? '<th>Lender</th><th>Secured loan</th><th>Unsecured loan</th><th>Secured rate</th><th>Unsecured rate</th><th>Compare</th><th>Action</th>'
              : '<th>Lender</th><th>Secured loan</th><th>Unsecured loan</th><th>Interest rates</th><th>Repayment &amp; fees</th><th>Compare</th><th>Action</th>'
            }</tr></thead>
            <tbody></tbody>
          </table>
        </div>
        ${comparePage ? '<section class="lc-inline" hidden aria-live="polite"><div class="lc-inline-head"><div><p class="lc-eyebrow">SIDE-BY-SIDE VIEW</p><h2>Your selected lender comparison</h2></div><button class="lc-clear" type="button">Clear comparison</button></div><div class="lc-grid-wrap"><div class="lc-grid"></div></div></section>' : ''}`;

      const toolbar = root.querySelector('.lc-toolbar');
      const toolbarClear = document.createElement('button');
      toolbarClear.className = 'lc-toolbar-clear lc-clear';
      toolbarClear.type = 'button';
      toolbarClear.textContent = 'Clear selection';
      toolbarClear.hidden = true;
      toolbar?.append(toolbarClear);
      const inlineClear = root.querySelector('.lc-inline .lc-clear');
      if (inlineClear) inlineClear.textContent = 'Clear selection';

      if (comparePage) {
        const comparisonHead = root.querySelector('.lc-inline-head');
        if (comparisonHead) {
          const back = document.createElement('a');
          back.className = 'lc-back-directory';
          back.href = '/lenders';
          back.textContent = 'Back to lenders';
          comparisonHead.append(back);
        }
      }

      const draw = () => {
        if (!connected(root)) return false;
        const tbody = root.querySelector('tbody');
        if (!tbody) return false;
        const full = selected.length === 4;
        tbody.innerHTML = items.map((lender) => `
          <tr>
            <td data-label="Lender"><div class="lc-lender">${lenderLogo(lender)}<span><strong>${lender.name}</strong><span class="lc-category">${lender.type === 'international' ? 'International lender' : lender.type === 'other' ? 'Specialist lender' : lender.type.toUpperCase()}</span></span></div></td>
            <td data-label="Secured loan maximum"><span class="lc-value">${display(lender.secured)}</span></td>
            <td data-label="Unsecured loan maximum"><span class="lc-value">${display(lender.unsecured)}</span></td>
            ${comparePage
              ? `<td data-label="Secured rate" class="lc-single-rate">${display(lender.securedRate)}</td><td data-label="Unsecured rate" class="lc-single-rate">${display(lender.unsecuredRate)}</td>`
              : `<td data-label="Interest rates">${rateMarkup(lender)}</td><td data-label="Repayment and fees">${termsMarkup(lender)}</td>`
            }
            <td data-label="Compare"><label class="lc-choice"><input type="checkbox" aria-label="Compare ${lender.name}" data-id="${lender.id}" ${selected.includes(lender.id) ? 'checked' : ''} ${full && !selected.includes(lender.id) ? 'disabled' : ''}></label></td>
            <td data-label="Action"><a class="lc-apply" href="/apply?lender=${encodeURIComponent(lender.id)}">Apply with us <span aria-hidden="true">→</span></a></td>
          </tr>`).join('');
        const count = root.querySelector('.lc-count');
        const button = root.querySelector('.lc-compare');
        const message = root.querySelector('.lc-selection-message');
        const clear = root.querySelector('.lc-toolbar-clear');
        if (count) count.innerHTML = `<span>${selected.length}</span> of 4 lenders selected`;
        if (toolbar) toolbar.hidden = selected.length === 0;
        if (button) { button.disabled = selected.length < 2; button.hidden = selected.length < 2; }
        if (clear) clear.hidden = selected.length === 0;
        if (message) {
          message.hidden = true;
          message.textContent = '';
        }
        return true;
      };

      const showComparison = (scroll) => {
        if (!comparePage || !connected(root)) return;
        const inline = root.querySelector('.lc-inline');
        const grid = root.querySelector('.lc-grid');
        if (!inline || !grid || selected.length < 2) return;
        const chosen = selected.map((id) => items.find((lender) => lender.id === id)).filter(Boolean);
        grid.innerHTML = chosen.map((lender) => `<article class="lc-summary"><header>${lenderLogo(lender)}<b>${lender.name}</b></header><button class="lc-remove" type="button" data-remove="${lender.id}">Remove</button><dl>${fields.map(([label, key]) => `<div><dt>${label}</dt><dd>${display(lender[key])}</dd></div>`).join('')}</dl></article>`).join('');
        grid.style.setProperty('--lc-cols', chosen.length);
        inline.hidden = false;
        if (scroll) inline.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      if (!draw()) return;
      root.addEventListener('change', (event) => {
        if (!connected(root)) return;
        const input = event.target.closest('[data-id]');
        if (!input) return;
        selected = input.checked ? [...selected, input.dataset.id] : selected.filter((id) => id !== input.dataset.id);
        draw();
      });
      root.querySelector('.lc-compare')?.addEventListener('click', () => {
        if (selected.length < 2) return;
        if (comparePage) { showComparison(true); return; }
        markCompareScroll(selected);
        location.href = `/compare-all-lenders?compare=${encodeURIComponent(selected.join(','))}`;
      });
      root.querySelectorAll('.lc-clear').forEach((clear) => clear.addEventListener('click', () => {
        selected = [];
        const inline = root.querySelector('.lc-inline');
        if (inline) inline.hidden = true;
        draw();
      }));
      root.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-remove]');
        if (!remove || !connected(root)) return;
        selected = selected.filter((id) => id !== remove.dataset.remove);
        const inline = root.querySelector('.lc-inline');
        if (inline) inline.hidden = true;
        draw();
      });
      if (comparePage && selected.length >= 2) {
        let scroll = false;
        try {
          const key = sessionStorage.getItem('cw-lender-compare-scroll');
          scroll = key === selected.join(',');
          if (scroll) sessionStorage.removeItem('cw-lender-compare-scroll');
        } catch {}
        showComparison(scroll);
      }
    }

    async function mount(root) {
      if (!connected(root) || root.dataset.lenderDirectoryMounted === 'true') return;
      root.dataset.lenderDirectoryMounted = 'true';
      root.innerHTML = '<p class="lc-loading" role="status" aria-live="polite">Loading lenders…</p>';
      try {
        const response = await fetch('/api/lenders', { headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (!Array.isArray(payload)) throw new Error();
        if (connected(root)) render(root, payload.map(normalize).filter(Boolean));
      } catch {
        if (connected(root)) root.innerHTML = '<p class="lc-error" role="alert">We could not load lenders right now. Please refresh the page or try again shortly.</p>';
      }
    }
    return { mount, initialize: () => document.querySelectorAll('[data-lender-category]').forEach(mount) };
  })();

  window.CredwisoryLenderDirectory = directory;
  const start = () => directory.initialize();
  if (document.readyState === 'loading') {
    if (!window.__cwLenderDirectoryListening) {
      window.__cwLenderDirectoryListening = true;
      document.addEventListener('DOMContentLoaded', start, { once: true });
    }
  } else start();

  if (!document.getElementById('cw-lender-directory-states')) {
    const style = document.createElement('style');
    style.id = 'cw-lender-directory-states';
    style.textContent = '.lc-loading,.lc-error,.lc-empty{margin:0;padding:24px;color:#61718a;font-weight:700}.lc-error{color:#9a6b00}.lc-selection-message{max-width:430px;margin:5px 0 0;color:#9a6b00;font-size:.82rem;font-weight:700}.lc-badge{display:inline-flex;width:34px;height:34px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:8px;background:#e7f3f2;color:#087b75;font-size:.68rem;font-weight:900}.lc-inline{margin-top:26px}.lc-inline-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}.lc-eyebrow{margin:0;color:#087b75;font-size:.72rem;font-weight:900;letter-spacing:.08em}.lc-inline h2{margin:3px 0 0;color:#0d2a52}.lc-clear,.lc-remove{border:1px solid #b9c8d5;border-radius:999px;background:#fff;color:#0d2a52;padding:7px 11px;font:inherit;font-weight:800;cursor:pointer}.lc-grid{display:grid;grid-template-columns:repeat(var(--lc-cols),minmax(0,1fr));gap:14px;margin-top:14px}.lc-summary{min-width:0;border:1px solid #dbe3ea;border-radius:12px;padding:14px}.lc-summary header{display:flex;align-items:center;gap:8px;color:#0d2a52}.lc-summary .lc-remove{margin:10px 0}.lc-summary dl{margin:0}.lc-summary dl div{display:flex;justify-content:space-between;gap:9px;padding:7px 0;border-top:1px solid #edf1f4}.lc-summary dt{color:#61718a;font-size:.75rem}.lc-summary dd{margin:0;text-align:right;font-size:.8rem;font-weight:700}@media(max-width:700px){.lc-grid{grid-template-columns:1fr}.lc-summary dl div{display:block}.lc-summary dd{text-align:left;margin-top:2px}}';
    document.head.append(style);
  }
})();
