const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- DEBUG STARTUP ---------------- */
console.log('DEBUG CWD:', process.cwd());
console.log('DEBUG __dirname:', __dirname);
console.log('DEBUG .env path:', path.join(__dirname, '.env'));
console.log('DEBUG MONGODB_URI loaded?', !!process.env.MONGODB_URI);

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

/* ---------------- MODELS ---------------- */
let AdminHomePage;
try {
  AdminHomePage = require('./models/Admin_Home_Page');
} catch (e) {
  console.warn('⚠️ Could not load ./models/Admin_Home_Page.');
}

let AdminAnimalsPage;
try {
  AdminAnimalsPage = require('./models/Admin_Animals_Page');
} catch (e) {
  console.warn('⚠️ Could not load ./models/Admin_Animals_Page.');
}

let AdminGalleryPage;
try {
  AdminGalleryPage = require('./models/Admin_Gallery_Page');
} catch (e) {
  console.warn('⚠️ Could not load ./models/Admin_Gallery_Page.');
}

let AdminAboutPage;
try {
  AdminAboutPage = require('./models/Admin_About_Page');
} catch (e) {
  console.warn('⚠️ Could not load ./models/Admin_About_Page.');
}

/* ---------------- VIEW ENGINE ---------------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- STATIC ---------------- */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

/* ---------------- BODY PARSING + METHOD OVERRIDE ---------------- */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

/* ---------------- SESSIONS ---------------- */
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

/* ---------------- ADMIN: NO-CACHE ---------------- */
app.use('/admin', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

/* ---------------- PUBLIC ROUTES ---------------- */
// Home
app.get('/home', async (req, res) => {
  try {
    let pageData = AdminHomePage ? await AdminHomePage.findOne({}).lean() : null;
    res.render('index', {
      title: 'Home Page',
      metaDescription: 'Hoffman’s Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.',
      metaKeywords: 'reptiles, snakes, lizards, Concord reptile shop, exotic pets California',
      pageData: pageData || null,
    });
  } catch (err) {
    console.error('❌ Error loading /home:', err);
    res.render('index', { title: 'Home Page', pageData: null });
  }
});

// Animals
app.get('/animals', async (req, res) => {
  try {
    let page = AdminAnimalsPage ? await AdminAnimalsPage.findOne({}).lean() : null;
    res.render('animals', {
      title: 'Animals',
      metaDescription: 'Browse our collection of exotic animals including reptiles, lizards, and snakes.',
      metaKeywords: 'animals, reptiles, exotic pets, lizards, snakes, Concord CA',
      pageData: page || { heroUrl: '', welcomeText: '', animals: [], footer: { title: '', text: '' } }
    });
  } catch (err) {
    console.error('❌ Error loading /animals:', err);
    res.render('animals', { title: 'Animals', pageData: { heroUrl: '', welcomeText: '', animals: [] } });
  }
});

// Gallery
function normalizeGallery(doc) {
  const d = doc || {};
  return {
    hero: { image: d?.hero?.image || d.heroUrl || '', title: d?.hero?.title || d.heroTitle || '', subtitle: d?.hero?.subtitle || d.heroSubtitle || '' },
    info: d.info || { title: '', text: '' },
    images: Array.isArray(d.images) ? d.images : [],
    footer: d.footer || { title: '', text: '' },
    heroUrl: (d?.hero?.image || d.heroUrl || ''),
    heroTitle: (d?.hero?.title || d.heroTitle || ''),
    heroSubtitle: (d?.hero?.subtitle || d.heroSubtitle || '')
  };
}
app.get('/gallery', async (req, res) => {
  try {
    let page = AdminGalleryPage ? await AdminGalleryPage.findOne({}).lean() : null;
    res.render('gallery', { title: 'Gallery', pageData: normalizeGallery(page) });
  } catch (err) {
    console.error('❌ Error loading /gallery:', err);
    res.render('gallery', { title: 'Gallery', pageData: normalizeGallery(null) });
  }
});

// About
app.get('/about', async (req, res) => {
  try {
    let page = AdminAboutPage ? await AdminAboutPage.findOne({}).lean() : null;
    res.render('about', {
      title: 'About Us',
      metaDescription: 'Learn about Hoffman’s Reptile Shop in Concord, California.',
      metaKeywords: 'about Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store',
      pageData: page || { hero: { image: '', title: '', subtitle: '' }, content: '', footer: { title: '', text: '' } }
    });
  } catch (err) {
    console.error('❌ Error loading /about:', err);
    res.render('about', { title: 'About Us', pageData: { hero: {}, content: '', footer: {} } });
  }
});

// Contact
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact',
    metaDescription: 'Contact Hoffman’s Reptile Shop in Concord, CA for exotic reptiles and supplies.',
    metaKeywords: 'contact Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store',
  });
});

/* ---------------- CONTACT FORM ---------------- */
app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'hudsonriver4151@gmail.com', pass: 'hols yaqs wxdk nfyl' },
  });
  try {
    await transporter.sendMail({ from: email, to: 'hudsonriver4151@gmail.com', subject: `Message from ${name}`, text: message, replyTo: email });
    await transporter.sendMail({ from: 'hudsonriver4151@gmail.com', to: email, subject: "Thanks for contacting Hoffman's Reptile Shop!", html: `<p>Thanks ${name || 'Friend'}! We’ll get back to you soon.</p>` });
    res.send('<h1>Email sent successfully!</h1>');
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    res.status(500).send('Error sending message: ' + err.message);
  }
});

/* ---------------- ADMIN ROUTES ---------------- */
const adminRouter = require('./adminapp');
app.use('/admin', adminRouter);

const adminRoutesPage = require('./admin_routes_page');
app.use('/admin', adminRoutesPage);

const adminAnimalsRoutes = require('./admin_animals_routes_page');
app.use('/admin', adminAnimalsRoutes);

const adminGalleryRoutes = require('./admin_gallery_routes_page');
app.use('/admin', adminGalleryRoutes);

// ✅ NEW: About page admin routes
const adminAboutRoutes = require('./admin_about_routes_page');
app.use('/admin', adminAboutRoutes);

/* ---------------- DEFAULT & STATIC ---------------- */
app.get('/', (req, res) => res.redirect('/home'));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'public', 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'public', 'robots.txt')));

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
