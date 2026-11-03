(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const state = { catalog: [], filter: 'all', query: '', favorites: new Set(), loggedIn: false, busy: new Set() };
  const normalize = (v) => String(v ?? '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const itemType = (item) => {
    const raw = normalize(`${item.type || ''} ${item.category || ''}`);
    if (raw.includes('serie')) return 'serie';
    if (raw.includes('anime')) return 'anime';
    return 'pelicula';
  };
  const titleOf = (item) => item.title || item.name || 'Sin título';
  const imageOf = (item) => item.backdrop || item.poster || item.image || '';
  const destination = (item) => item.url || item.href || '#';
  const idOf = (item) => String(item.id ?? item.content_id ?? '');
  const isFavorite = (item) => state.favorites.has(idOf(item));
  function toast(message, error = false) {
    let node = $('#cinemaxToast');
    if (!node) { node = document.createElement('div'); node.id = 'cinemaxToast'; node.className = 'cinemax-toast'; node.setAttribute('role', 'status'); document.body.append(node); }
    node.textContent = message; node.classList.toggle('is-error', error); node.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2800);
  }
  function card(item) {
    const wrap = document.createElement('article'); wrap.className = 'movie-card-wrap';
    const a = document.createElement('a'); a.className = 'movie-card'; a.href = destination(item);
    const poster = document.createElement('div'); poster.className = 'poster';
    const src = imageOf(item);
    if (src) {
      const img = document.createElement('img'); img.loading = 'lazy'; img.alt = titleOf(item); img.src = src;
      img.onerror = () => { poster.querySelector('img')?.remove(); const fallback = document.createElement('div'); fallback.className = 'poster-fallback'; fallback.textContent = 'CINEMAX'; poster.prepend(fallback); };
      poster.append(img);
    } else { const fallback = document.createElement('div'); fallback.className = 'poster-fallback'; fallback.textContent = 'CINEMAX'; poster.append(fallback); }
    const overlay = document.createElement('div'); overlay.className = 'poster-overlay'; overlay.innerHTML = '<span class="play-circle">▶</span>'; poster.append(overlay);
    const info = document.createElement('div'); info.className = 'movie-info';
    const title = document.createElement('strong'); title.textContent = titleOf(item);
    const meta = document.createElement('span'); meta.textContent = [item.year || 'CINEMAX', item.genre || item.category || item.type || 'Contenido'].filter(Boolean).join(' · ');
    info.append(title, meta); a.append(poster, info); wrap.append(a);
    const fav = document.createElement('button'); fav.type = 'button'; fav.className = `favorite-toggle${isFavorite(item) ? ' is-saved' : ''}`;
    fav.setAttribute('aria-label', isFavorite(item) ? 'Quitar de mi lista' : 'Guardar en mi lista');
    fav.setAttribute('aria-pressed', String(isFavorite(item))); fav.textContent = isFavorite(item) ? '♥ Guardado' : '＋ Mi lista';
    fav.disabled = !idOf(item) || state.busy.has(idOf(item));
    fav.addEventListener('click', () => toggleFavorite(item, fav)); wrap.append(fav);
    return wrap;
  }
  function renderGrid(target, items) {
    const node = $(target); node.replaceChildren();
    if (!items.length) { const empty = document.createElement('div'); empty.className = 'loading-card'; empty.textContent = state.filter === 'favorites' ? 'Todavía no tienes títulos guardados.' : 'No hay títulos para mostrar.'; node.append(empty); return; }
    items.forEach(item => node.append(card(item)));
  }
  function visibleItems() {
    return state.catalog.filter(item =>
      (state.filter === 'all' || state.filter === 'favorites' ? (state.filter !== 'favorites' || isFavorite(item)) : itemType(item) === state.filter) &&
      (!state.query || normalize([titleOf(item), item.genre, item.category, item.description, item.year].join(' ')).includes(state.query))
    );
  }
  function render() {
    const all = visibleItems(); renderGrid('#catalogGrid', all);
    $('#emptyState').hidden = all.length !== 0;
    const trending = state.catalog.filter(x => x.featured || x.backdrop).slice(0, 5);
    renderGrid('#trendingGrid', (trending.length ? trending : state.catalog).slice(0, 5));
    renderGrid('#discoverGrid', state.catalog.slice(5, 10));
    $('#countMovies').textContent = state.catalog.length.toLocaleString('es');
    $('#countFavorites').textContent = state.favorites.size.toLocaleString('es');
    const featured = state.catalog.find(x => x.featured && imageOf(x)) || state.catalog.find(x => imageOf(x));
    if (featured) {
      const bg = imageOf(featured); $('#heroBackdrop').style.backgroundImage = `url("${bg.replace(/["\\]/g, '')}")`;
      $('#heroTitle').textContent = titleOf(featured);
      $('#heroDescription').textContent = featured.description || 'Una historia extraordinaria te espera. Descúbrela en CINEMAX.';
      $('#heroTag').textContent = (featured.type || 'DESTACADO').toUpperCase();
      $('#heroPlay').href = destination(featured);
      $('#heroMeta').textContent = `${featured.year || 'CINEMAX'}  •  ${featured.genre || 'EXPERIENCIA CINEMATOGRÁFICA'}`;
    }
    $('#catalogHint').textContent = state.loggedIn ? 'Tu lista se sincroniza con tu cuenta CINEMAX.' : 'Inicia sesión para guardar tus favoritos y tenerlos siempre a mano.';
  }
  async function loadFavorites() {
    try {
      const response = await fetch('/api/favorites', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (!response.ok) { state.loggedIn = false; return; }
      const data = await response.json();
      state.loggedIn = !!data.success;
      if (state.loggedIn) { const account = $('#accountLink'); account.textContent = 'Mi cuenta'; account.href = 'usuario.html'; }
      state.favorites = new Set((data.favorites || []).map(x => String(x.content_id)));
    } catch (_) { state.loggedIn = false; }
  }
  async function toggleFavorite(item, button) {
    const id = idOf(item);
    if (!id) return;
    if (!state.loggedIn) { toast('Inicia sesión para crear tu lista.', true); location.href = `login.html?next=${encodeURIComponent(location.pathname + location.hash)}`; return; }
    state.busy.add(id); button.disabled = true;
    try {
      const removing = state.favorites.has(id);
      const response = await fetch(removing ? `/api/favorites/${encodeURIComponent(id)}` : '/api/favorites', {
        method: removing ? 'DELETE' : 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: removing ? undefined : JSON.stringify({ content_id: id, title: titleOf(item), content_type: item.type || item.category || '', genre: item.genre || '', year: item.year || '', url: destination(item), video: item.video || '' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || 'No se pudo actualizar tu lista.');
      if (removing) state.favorites.delete(id); else state.favorites.add(id);
      toast(removing ? 'Eliminado de Mi lista.' : 'Guardado en Mi lista.');
      render();
    } catch (error) { toast(error.message || 'Error de conexión.', true); button.disabled = false; }
    finally { state.busy.delete(id); }
  }
  async function load() {
    try {
      const response = await fetch('/api/catalog', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json(); const raw = data.catalog ?? data;
      state.catalog = Array.isArray(raw) ? raw : Object.values(raw || {});
      await loadFavorites(); render();
    } catch (error) {
      ['#trendingGrid', '#discoverGrid', '#catalogGrid'].forEach(sel => { $(sel).textContent = 'No pudimos conectar con el catálogo. Comprueba que el servidor CINEMAX esté activo.'; });
      console.error('CINEMAX catalog:', error);
    }
  }
  $('#searchInput').addEventListener('input', e => { state.query = normalize(e.target.value).trim(); renderGrid('#catalogGrid', visibleItems()); $('#emptyState').hidden = visibleItems().length !== 0; });
  document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
    document.querySelector('.filter.active')?.classList.remove('active'); btn.classList.add('active');
    state.filter = btn.dataset.filter; renderGrid('#catalogGrid', visibleItems()); $('#emptyState').hidden = visibleItems().length !== 0;
  }));
  $('#menuToggle').addEventListener('click', () => $('.main-nav').classList.toggle('open'));
  document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => $('.main-nav').classList.remove('open')));
  $('#year').textContent = new Date().getFullYear();
  load();
})();