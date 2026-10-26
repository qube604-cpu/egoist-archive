const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
let content = null;
let authenticated = false;
let projectsDraft = [];
let linksDraft = [];

function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 2600);
}
function safeHref(value) {
  const v = String(value || '').trim();
  if (v.startsWith('#')) return v;
  try { const u = new URL(v, window.location.origin); return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : ''; }
  catch { return ''; }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function render(data) {
  content = data;
  document.title = `${data.displayName || 'EGOIST ARCHIVE'} — personal portfolio`;
  $('.brand').innerHTML = 'EGOIST <em>/</em> ARCHIVE';
  $('#eyebrow').textContent = data.eyebrow;
  $('#headline').textContent = data.headline;
  $('#headlineAccent').textContent = data.headlineAccent;
  $('#intro').textContent = data.intro;
  $('#quoteText').textContent = `“${data.quote}”`;
  $('#quoteBy').textContent = data.quoteBy;
  $('#aboutTitle').textContent = data.aboutTitle;
  $('#aboutText').textContent = data.aboutText;
  $('#footer').textContent = data.footer;
  const portrait = $('#portrait'); const image = $('#portraitImage');
  image.alt = data.imageAlt || 'Портрет';
  image.onload = () => portrait.classList.add('has-image');
  image.onerror = () => { if (image.src.endsWith('/isagi.jpg')) portrait.classList.add('has-image'); else { image.src = '/isagi.jpg'; } };
  image.src = data.imageUrl && safeHref(data.imageUrl) ? safeHref(data.imageUrl) : '/isagi.jpg';
  const projectRoot = $('#projects'); projectRoot.replaceChildren();
  (data.projects || []).forEach((p, i) => {
    const card = el('article', 'card'); card.dataset.num = String(i + 1).padStart(2, '0');
    card.append(el('div', 'cat', p.category || `PROJECT / ${String(i + 1).padStart(3, '0')}`));
    card.append(el('h3', '', p.title)); card.append(el('p', '', p.description));
    const href = safeHref(p.url);
    if (href) { const a = el('a', 'arrow', p.label || 'ОТКРЫТЬ ↗'); a.href = href; if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } card.append(a); }
    else card.append(el('span', 'arrow', p.label || 'СКОРО / IN PROGRESS'));
    projectRoot.append(card);
  });
  const linkRoot = $('#linksList'); linkRoot.replaceChildren();
  (data.links || []).forEach(l => {
    const href = safeHref(l.url); const item = href ? el('a', 'link-pill') : el('div', 'link-pill');
    if (href) { item.href = href; if (/^https?:/i.test(href)) { item.target = '_blank'; item.rel = 'noopener noreferrer'; } }
    item.append(el('span', 'symbol', l.icon || '↗'));
    const copy = el('span'); copy.append(el('strong', '', l.name), el('small', '', l.note || (href || 'Ссылка пока не добавлена')));
    item.append(copy); linkRoot.append(item);
  });
}
function openOverlay(id) { $(`#${id}`).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeOverlay(id) { $(`#${id}`).classList.remove('open'); if (!$('.overlay.open')) document.body.style.overflow = ''; }
$$('[data-close]').forEach(b => b.addEventListener('click', () => closeOverlay(b.dataset.close)));
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) closeOverlay(o.id); }));
$('#adminOpen').addEventListener('click', async () => {
  try {
    const state = await api('/api/admin/session');
    if (state.authenticated) { await openEditor(); } else { $('#loginError').classList.add('hidden'); $('#password').value = ''; openOverlay('loginOverlay'); setTimeout(() => $('#password').focus(), 80); }
  } catch { toast('Не удалось связаться с сервером.'); }
});
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const button = $('button[type="submit"]', e.currentTarget); button.disabled = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: $('#password').value }) });
    authenticated = true; closeOverlay('loginOverlay'); await openEditor(); toast('Вход выполнен. Добро пожаловать в контрольную комнату.');
  } catch (err) { $('#loginError').textContent = err.message; $('#loginError').classList.remove('hidden'); }
  finally { button.disabled = false; }
});
function field(label, value, onChange, type = 'text') {
  const wrap = el('div', 'field'); const id = `dynamic-${Math.random().toString(36).slice(2)}`;
  const lab = el('label', '', label); lab.htmlFor = id; const input = el(type === 'textarea' ? 'textarea' : 'input'); input.id = id; input.value = value || ''; input.maxLength = 2000; input.addEventListener('input', () => onChange(input.value)); wrap.append(lab, input); return wrap;
}
function renderProjectEditor() {
  const root = $('#projectEditor'); root.replaceChildren();
  projectsDraft.forEach((p, i) => {
    const item = el('div', 'admin-item'); const head = el('div', 'admin-item-head'); head.append(el('span', '', `PROJECT / ${String(i + 1).padStart(3, '0')}`));
    const del = el('button', 'btn danger', 'Удалить'); del.type = 'button'; del.addEventListener('click', () => { projectsDraft.splice(i, 1); renderProjectEditor(); }); head.append(del); item.append(head);
    const grid = el('div', 'form-grid');
    [['Категория', 'category', 'text'], ['Название', 'title', 'text'], ['Описание', 'description', 'textarea'], ['Ссылка (URL)', 'url', 'text'], ['Текст ссылки', 'label', 'text']].forEach(([label, key, type]) => grid.append(field(label, p[key], v => p[key] = v, type)));
    item.append(grid); root.append(item);
  });
  if (!projectsDraft.length) root.append(el('p', '', 'Пока нет работ. Нажми «Добавить».'));
}
function renderLinkEditor() {
  const root = $('#linkEditor'); root.replaceChildren();
  linksDraft.forEach((l, i) => {
    const item = el('div', 'admin-item'); const head = el('div', 'admin-item-head'); head.append(el('span', '', `LINK / ${String(i + 1).padStart(3, '0')}`));
    const del = el('button', 'btn danger', 'Удалить'); del.type = 'button'; del.addEventListener('click', () => { linksDraft.splice(i, 1); renderLinkEditor(); }); head.append(del); item.append(head);
    const grid = el('div', 'form-grid');
    [['Название', 'name', 'text'], ['Подпись', 'note', 'text'], ['URL', 'url', 'text'], ['Символ', 'icon', 'text']].forEach(([label, key, type]) => grid.append(field(label, l[key], v => l[key] = v, type)));
    item.append(grid); root.append(item);
  });
  if (!linksDraft.length) root.append(el('p', '', 'Пока нет ссылок. Нажми «Добавить».'));
}
async function openEditor() {
  if (!authenticated) { const state = await api('/api/admin/session'); authenticated = state.authenticated; }
  if (!authenticated) { openOverlay('loginOverlay'); return; }
  const fresh = await api('/api/content'); content = fresh;
  $$('[data-field]').forEach(input => { input.value = fresh[input.dataset.field] ?? ''; });
  projectsDraft = structuredClone(fresh.projects || []); linksDraft = structuredClone(fresh.links || []);
  renderProjectEditor(); renderLinkEditor(); $('#saveError').classList.add('hidden'); openOverlay('editorOverlay');
}
$('#addProject').addEventListener('click', () => { if (projectsDraft.length >= 12) return toast('Можно добавить максимум 12 работ.'); projectsDraft.push({ category: 'PROJECT / NEW', title: 'Новая работа', description: 'Добавь описание проекта.', url: '', label: 'ОТКРЫТЬ ↗' }); renderProjectEditor(); });
$('#addLink').addEventListener('click', () => { if (linksDraft.length >= 20) return toast('Можно добавить максимум 20 ссылок.'); linksDraft.push({ name: 'Новая ссылка', note: 'Описание площадки', url: '', icon: '↗' }); renderLinkEditor(); });
$('#editorForm').addEventListener('submit', async e => {
  e.preventDefault(); const button = $('#saveBtn'); button.disabled = true; $('#saveError').classList.add('hidden');
  const updated = { ...content };
  $$('[data-field]').forEach(input => updated[input.dataset.field] = input.value.trim());
  updated.projects = projectsDraft; updated.links = linksDraft;
  try {
    const result = await api('/api/admin/content', { method: 'PUT', body: JSON.stringify(updated) });
    render(result.content); content = result.content; toast('Изменения опубликованы для всех посетителей ✓'); closeOverlay('editorOverlay');
  } catch (err) { $('#saveError').textContent = err.message; $('#saveError').classList.remove('hidden'); }
  finally { button.disabled = false; }
});
$('#logoutBtn').addEventListener('click', async () => {
  try { await api('/api/admin/logout', { method: 'POST', body: '{}' }); } catch {}
  authenticated = false; closeOverlay('editorOverlay'); toast('Вы вышли из панели администратора.');
});
(async function init() {
  try { render(await api('/api/content')); }
  catch { $('#intro').textContent = 'Сервер пока не подключён. Запусти приложение по инструкции в README.'; toast('Не удалось загрузить данные сайта.'); }
})();
