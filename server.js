require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
if (sessionSecret.length < 32 || adminPassword.length < 12) {
  console.error('Setup required: set SESSION_SECRET (32+ characters) and ADMIN_PASSWORD (12+ characters) in .env.');
  process.exit(1);
}
if (isProd) app.set('trust proxy', 1);

const dataDir = path.resolve(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(dataDir, 'egoist.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);

const defaults = {
  displayName: 'EGOIST ARCHIVE',
  eyebrow: 'PERSONAL ARCHIVE / BLUE LOCK MINDSET',
  headline: 'МОЁ ЭГО.',
  headlineAccent: 'МОЙ ПУТЬ.',
  intro: 'Личное пространство для мыслей, текстов и цифровых проектов. Не финальная версия — постоянная эволюция.',
  imageUrl: '',
  imageAlt: 'Место для изображения Исаги Ёити',
  quote: 'Я не жду идеального момента. Я создаю следующую версию себя.',
  quoteBy: 'EGO × VISION × EVOLUTION',
  aboutTitle: 'Не персона. Характер.',
  aboutText: 'Здесь будет твой рассказ о себе: что тебя вдохновляет, что ты создаёшь и куда хочешь прийти. Измени этот текст через админ-панель.',
  projects: [
    { category: 'TEXTS / 001', title: 'Тексты и мысли', description: 'Заметки, истории, наблюдения и фразы, в которых остаётся часть меня.', url: '', label: 'ОТКРЫТЬ АРХИВ ↗' },
    { category: 'CODE / 002', title: 'Программирование', description: 'Учебные и личные проекты, эксперименты с кодом и идеи в разработке.', url: '', label: 'СМОТРЕТЬ ПРОЕКТЫ ↗' },
    { category: 'ABOUT / 003', title: 'Мой путь', description: 'Кто я, что меня формирует и какой версией себя я хочу стать.', url: '#about', label: 'УЗНАТЬ БОЛЬШЕ ↗' }
  ],
  links: [
    { name: 'Telegram', note: 'Добавь свой профиль', url: '', icon: '↗' },
    { name: 'GitHub', note: 'Код и проекты', url: '', icon: '⌘' }
  ],
  footer: '© EGOIST ARCHIVE — ALWAYS IN PROGRESS'
};
const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
const existing = db.prepare('SELECT id FROM site_content WHERE id = 1').get();
if (!existing) db.prepare('INSERT INTO site_content (id, content_json, updated_at) VALUES (1, ?, ?)').run(JSON.stringify(defaults), new Date().toISOString());
const readContent = () => JSON.parse(db.prepare('SELECT content_json FROM site_content WHERE id = 1').get().content_json);
const saveContent = db.prepare('UPDATE site_content SET content_json = ?, updated_at = ? WHERE id = 1');

app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], baseUri: ["'self'"], fontSrc: ["'self'", 'https:', 'data:'],
  imgSrc: ["'self'", 'https:', 'data:'], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  scriptSrc: ["'self'"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"]
} }}));
app.use(express.json({ limit: '200kb' }));
app.use(session({
  name: 'egoist.sid', secret: sessionSecret, resave: false, saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: dataDir, table: 'sessions', concurrentDB: true }),
  cookie: { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 4 }
}));
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false }));
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin) {
    try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Origin rejected' }); }
    catch { return res.status(403).json({ error: 'Origin rejected' }); }
  }
  next();
});
const requireAdmin = (req, res, next) => req.session && req.session.isAdmin ? next() : res.status(401).json({ error: 'Требуется вход администратора.' });
const text = (v, max = 2000) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const validUrl = v => {
  const u = text(v, 2000);
  if (!u) return '';
  if (u.startsWith('#')) return u.slice(0, 120);
  try { const parsed = new URL(u); return ['https:', 'http:', 'mailto:'].includes(parsed.protocol) ? parsed.href : ''; }
  catch { return ''; }
};
function validImageUrl(v) {
  const u = text(v, 2000);
  if (!u) return '';
  try { const parsed = new URL(u); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : ''; }
  catch { return ''; }
}
function sanitizeContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Неверный формат данных.');
  const arr = (value, max, mapper) => Array.isArray(value) ? value.slice(0, max).map(mapper) : [];
  return {
    displayName: text(input.displayName, 80) || defaults.displayName,
    eyebrow: text(input.eyebrow, 120), headline: text(input.headline, 100), headlineAccent: text(input.headlineAccent, 100),
    intro: text(input.intro, 1200), imageUrl: validImageUrl(input.imageUrl), imageAlt: text(input.imageAlt, 180) || defaults.imageAlt,
    quote: text(input.quote, 500), quoteBy: text(input.quoteBy, 120), aboutTitle: text(input.aboutTitle, 120), aboutText: text(input.aboutText, 1800),
    projects: arr(input.projects, 12, p => ({ category: text(p?.category, 60), title: text(p?.title, 120), description: text(p?.description, 800), url: validUrl(p?.url), label: text(p?.label, 80) })),
    links: arr(input.links, 20, l => ({ name: text(l?.name, 80), note: text(l?.note, 180), url: validUrl(l?.url), icon: text(l?.icon, 8) || '↗' })),
    footer: text(input.footer, 180)
  };
}
app.get('/api/content', (req, res) => res.json(readContent()));
app.get('/api/admin/session', (req, res) => res.json({ authenticated: !!req.session.isAdmin }));
app.post('/api/admin/login', async (req, res) => {
  const submitted = text(req.body?.password, 500);
  if (!submitted || submitted.length > 500 || !await bcrypt.compare(submitted, adminPasswordHash)) {
    // Constant-time comparison via bcrypt; the configured password is never sent to the client.
    return res.status(401).json({ error: 'Неверный пароль.' });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Не удалось создать сессию.' });
    req.session.isAdmin = true;
    req.session.save(err2 => err2 ? res.status(500).json({ error: 'Не удалось сохранить сессию.' }) : res.json({ ok: true }));
  });
});
app.post('/api/admin/logout', requireAdmin, (req, res) => req.session.destroy(err => {
  res.clearCookie('egoist.sid', { httpOnly: true, secure: isProd, sameSite: 'strict' });
  if (err) return res.status(500).json({ error: 'Не удалось завершить сессию.' });
  res.json({ ok: true });
}));
app.put('/api/admin/content', requireAdmin, (req, res) => {
  try {
    const clean = sanitizeContent(req.body);
    saveContent.run(JSON.stringify(clean), new Date().toISOString());
    res.json({ ok: true, content: clean });
  } catch (err) { res.status(400).json({ error: err.message || 'Не удалось сохранить данные.' }); }
});
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: isProd ? '1h' : 0 }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EGOIST ARCHIVE running on port ${PORT}`);
});
