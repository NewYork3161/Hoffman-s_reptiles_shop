// app.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- TRUST PROXY (Render/behind proxies) ---------------- */
app.set('trust proxy', 1);

/* ---------------- MONGOOSE CONNECTION ---------------- */
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}
mongoose.set('strictQuery', true);
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* ---------------- MODELS (optional) ---------------- */
let AdminHomePage, AdminAnimalsPage, AdminGalleryPage, AdminAboutPage, AdminContactPage;
try { AdminHomePage = require('./models/Admin_Home_Page'); } catch {}
try { AdminAnimalsPage = require('./models/Admin_Animals_Page'); } catch {}
try { AdminGalleryPage = require('./models/Admin_Gallery_Page'); } catch {}
try { AdminAboutPage = require('./models/Admin_About_Page'); } catch {}
try { AdminContactPage = require('./models/Admin_Contact_Page'); } catch {}

/* ---------------- VIEW ENGINE ---------------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- STATIC & MIDDLEWARE ---------------- */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
}));

/* ---------------- ADMIN NO-CACHE ---------------- */
app.use('/admin', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

/* ---------------- PAGES ---------------- */
app.get('/', (_req, res) => res.redirect('/home'));

app.get('/home', async (_req, res) => {
  const pageData = AdminHomePage ? await AdminHomePage.findOne({}).lean() : null;
  res.render('index', {
    title: 'Home Page',
    metaDescription: "Hoffman's Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.",
    metaKeywords: 'reptiles, snakes, lizards, Concord reptile shop, exotic pets California',
    pageData
  });
});

// NOTE: this route is now covered by publicAnimalsRouter too
// but we can keep it for backward-compatibility
app.get('/animals', async (_req, res) => {
  const page = AdminAnimalsPage ? await AdminAnimalsPage.findOne({}).lean() : null;
  res.render('animals', {
    title: 'Animals',
    metaDescription: 'Browse our collection of exotic animals including reptiles, lizards, and snakes.',
    metaKeywords: 'animals, reptiles, exotic pets, lizards, snakes, Concord CA',
    pageData: page || { heroUrl: '', welcomeText: '', animals: [], footer: { title: '', text: '' } }
  });
});

function normalizeGallery(doc) {
  const d = doc || {};
  return {
    hero: {
      image: d?.hero?.image || d.heroUrl || '',
      title: d?.hero?.title || d.heroTitle || '',
      subtitle: d?.hero?.subtitle || d.heroSubtitle || ''
    },
    info: d.info || { title: '', text: '' },
    images: Array.isArray(d.images) ? d.images : [],
    footer: d.footer || { title: '', text: '' }
  };
}

app.get('/gallery', async (_req, res) => {
  const page = AdminGalleryPage ? await AdminGalleryPage.findOne({}).lean() : null;
  res.render('gallery', { title: 'Gallery', pageData: normalizeGallery(page) });
});

app.get('/about', async (_req, res) => {
  const page = AdminAboutPage ? await AdminAboutPage.findOne({}).lean() : null;
  res.render('about', {
    title: 'About Us',
    metaDescription: "Learn about Hoffman's Reptile Shop in Concord, California.",
    metaKeywords: "about Hoffman's Reptiles, Concord CA reptile shop, exotic pet store",
    pageData: page || { hero: {}, content: '', footer: {} }
  });
});

app.get('/contact', async (req, res) => {
  const page = AdminContactPage ? await AdminContactPage.findOne({}).lean() : null;
  res.render('contact', {
    title: 'Contact',
    metaDescription: "Contact Hoffman's Reptile Shop in Concord, CA for exotic reptiles and supplies.",
    metaKeywords: "contact Hoffman's Reptiles, Concord CA reptile shop, exotic pet store",
    pageData: page || { hero: {}, info: {}, details: {}, footer: {} },
    msg: req.query.msg || ''
  });
});

/* ---------------- ROUTERS ---------------- */
const contactRouter = require('./admin_contact_routes_page');
app.use('/admin', contactRouter);

// Backward-compatibility aliases for old form actions
app.post('/send-email', (req, res) => res.redirect(307, '/admin/contact/send'));
app.post('/contact/send', (req, res) => res.redirect(307, '/admin/contact/send'));

app.use('/admin', require('./adminapp'));
app.use('/admin', require('./admin_routes_page'));
app.use('/admin', require('./admin_gallery_routes_page'));
app.use('/admin', require('./admin_about_routes_page'));

// ✅ FIXED: Animals routes
const { adminRouter: animalsAdminRouter, publicAnimalsRouter } =
  require('./admin_animals_routes_page');
app.use('/admin', animalsAdminRouter);   // Admin editor routes
app.use(publicAnimalsRouter);            // Public animals grid + detail pages

/* ---------------- MISC STATIC ---------------- */
app.get('/sitemap.xml', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'sitemap.xml')));
app.get('/robots.txt', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'robots.txt')));

/* ---------------- SUCCESS & HEALTH ---------------- */
app.get('/contact/success', (_req, res) => res.render('contact_success'));
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
