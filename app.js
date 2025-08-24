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
try { AdminHomePage = require('./models/Admin_Home_Page'); } catch (e) { console.warn('⚠️ Could not load ./models/Admin_Home_Page.'); }

let AdminAnimalsPage;
try { AdminAnimalsPage = require('./models/Admin_Animals_Page'); } catch (e) { console.warn('⚠️ Could not load ./models/Admin_Animals_Page.'); }

let AdminGalleryPage;
try { AdminGalleryPage = require('./models/Admin_Gallery_Page'); } catch (e) { console.warn('⚠️ Could not load ./models/Admin_Gallery_Page.'); }

let AdminAboutPage;
try { AdminAboutPage = require('./models/Admin_About_Page'); } catch (e) { console.warn('⚠️ Could not load ./models/Admin_About_Page.'); }

let AdminContactPage;
try { AdminContactPage = require('./models/Admin_Contact_Page'); } catch (e) { console.warn('⚠️ Could not load ./models/Admin_Contact_Page.'); }

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
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
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
      metaDescription: "Hoffman's Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.",
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
      metaDescription: "Learn about Hoffman's Reptile Shop in Concord, California.",
      metaKeywords: "about Hoffman's Reptiles, Concord CA reptile shop, exotic pet store",
      pageData: page || { hero: { image: '', title: '', subtitle: '' }, content: '', footer: { title: '', text: '' } }
    });
  } catch (err) {
    console.error('❌ Error loading /about:', err);
    res.render('about', { title: 'About Us', pageData: { hero: {}, content: '', footer: {} } });
  }
});

// Contact
app.get('/contact', async (req, res) => {
  try {
    let page = AdminContactPage ? await AdminContactPage.findOne({}).lean() : null;
    res.render('contact', {
      title: 'Contact',
      metaDescription: "Contact Hoffman's Reptile Shop in Concord, CA for exotic reptiles and supplies.",
      metaKeywords: "contact Hoffman's Reptiles, Concord CA reptile shop, exotic pet store",
      pageData: page || {
        hero: { image: '', title: '', subtitle: '' },
        info: { title: '', text: '' },
        details: { address: '', phone: '', email: '', hours: '', mapEmbed: '' },
        footer: { title: '', text: '' }
      }
    });
  } catch (err) {
    console.error('❌ Error loading /contact:', err);
    res.render('contact', { title: 'Contact', pageData: { hero: {}, info: {}, details: {}, footer: {} } });
  }
});

/* ---------------- CONTACT FORM (Styled Emails + Pretty Confirmation) ---------------- */
app.post('/send-email', async (req, res) => {
  const { name = '', email = '', message = '' } = req.body;

  const SITE_BASE_URL = 'https://hoffman-s-reptiles-shop.onrender.com';
  const LOGO_URL = `${SITE_BASE_URL}/Images/Logo.png`;
  const STORE_ADDRESS = '2359 Concord Blvd, Concord, CA 94520';
  const STORE_PHONE   = '(925) 671-9106';
  const MAP_URL = `https://www.google.com/maps?q=${encodeURIComponent(STORE_ADDRESS)}`;

  // Hardcoded Gmail (App Password: your 16 letters without spaces)
  const GMAIL_USER = 'hudsonriver4151@gmail.com';
  const GMAIL_PASS = 'sdpukporlygrtyln'; // from "sdpu kpor lygr tyln"

  // Reliable Gmail SMTP settings
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });

  // Button helper
  const btn = (href, label) => `
    <a href="${href}" target="_blank"
       style="display:inline-block;padding:12px 18px;background:#28a745;color:#000;
              text-decoration:none;border-radius:8px;font-weight:700;">
      ${label}
    </a>`;

  // Email to shop owner
  const ownerHtml = `
    <div style="background:#0b0b0b;color:#e9ffe9;font-family:Arial,Helvetica,sans-serif;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
        <div style="padding:20px;border-bottom:1px solid #1f1f1f;display:flex;align-items:center;gap:12px;">
          <img src="${LOGO_URL}" alt="Hoffman's Reptiles" style="height:40px;width:auto;">
          <h2 style="margin:0;color:#28a745;">New Contact Message 📨</h2>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 10px 0;"><strong>From:</strong> ${name || 'Unknown'} &lt;${email || 'no email provided'}&gt;</p>
          <p style="white-space:pre-line;margin:14px 0 24px 0;line-height:1.6;">${message || '(no message)'}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${email ? btn('mailto:' + email, 'Reply to Customer') : ''}
            ${btn(MAP_URL, 'View Store Map')}
          </div>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #1f1f1f;color:#b7ffb7;font-size:12px;">
          Hoffman's Reptiles • ${STORE_ADDRESS} • ${STORE_PHONE}
        </div>
      </div>
    </div>`;

  const ownerText = `New message from ${name || 'Unknown'} <${email || 'no email'}>:

${message || '(no message)'}
Store: ${STORE_ADDRESS} | ${STORE_PHONE}`;

  // Auto-reply to customer
  const customerHtml = `
    <div style="background:#0b0b0b;color:#e9ffe9;font-family:Arial,Helvetica,sans-serif;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
        <div style="padding:20px;border-bottom:1px solid #1f1f1f;display:flex;align-items:center;gap:12px;">
          <img src="${LOGO_URL}" alt="Hoffman's Reptiles" style="height:40px;width:auto;">
          <h2 style="margin:0;color:#28a745;">Thanks for reaching out! 🐍🦎</h2>
        </div>
        <div style="padding:20px;line-height:1.75;">
          <p style="margin:0 0 10px 0;">Hi ${name || 'Friend'},</p>
          <p style="margin:0 0 14px 0;">
            Thank you for contacting <strong>Hoffman's Reptiles</strong>! We’ll get back to you as soon as we can.
          </p>
          <p style="margin:0 0 14px 0;">
            In the meantime, feel free to stop by the shop. If you need directions, tap the button below:
          </p>
          <div style="margin:18px 0;">
            ${btn(MAP_URL, '🗺️ View Map')}
          </div>
          <p style="margin:16px 0 0 0;">
            <strong>Address:</strong> ${STORE_ADDRESS}<br/>
            <strong>Phone:</strong> ${STORE_PHONE}<br/>
            <strong>Website:</strong> <a href="${SITE_BASE_URL}" style="color:#28a745;text-decoration:none;">${SITE_BASE_URL}</a>
          </p>
          <p style="margin:18px 0 0 0;">Talk soon! — Hoffman's Reptiles Team</p>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #1f1f1f;color:#b7ffb7;font-size:12px;">
          This inbox is monitored during store hours. If it's urgent, please call us at ${STORE_PHONE}.
        </div>
      </div>
    </div>`;

  const customerText = `Thanks for contacting Hoffman's Reptiles!

Hi ${name || 'Friend'},

We received your message and will get back to you as soon as we can.
Address: ${STORE_ADDRESS}
Phone: ${STORE_PHONE}
Map: ${MAP_URL}
Website: ${SITE_BASE_URL}
`;

  try {
    // Send to shop
    await transporter.sendMail({
      from: GMAIL_USER,
      to: GMAIL_USER,
      replyTo: email || undefined,
      subject: `Message from ${name || 'Website Visitor'}`,
      html: ownerHtml,
      text: ownerText,
    });

    // Auto-reply to customer
    if (email) {
      await transporter.sendMail({
        from: GMAIL_USER,
        to: email,
        subject: "Thanks for contacting Hoffman's Reptiles! 🐍🦎",
        html: customerHtml,
        text: customerText,
      });
    }

    // Confirmation page
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Email Sent</title>
        <link rel="icon" type="image/png" href="/Images/Logo.png" />
        <style>
          body{margin:0;background:#000;color:#28a745;font-family:Arial,Helvetica,sans-serif;}
          .wrap{max-width:760px;margin:40px auto;padding:24px;}
          .card{background:#0f0f0f;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden;}
          .head{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid #1f1f1f;}
          .head img{height:36px;width:auto;}
          h1{margin:0;color:#28a745;font-size:1.5rem;}
          .body{padding:20px;line-height:1.75;color:#d7ffd7;}
          .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;}
          .btn{display:inline-block;padding:12px 18px;background:#28a745;color:#000;text-decoration:none;border-radius:8px;font-weight:700;}
          .muted{color:#9afc9a;font-size:12px;padding:14px 20px;border-top:1px solid #1f1f1f;}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <div class="head">
              <img src="/Images/Logo.png" alt="Hoffman's Reptiles"/>
              <h1>Your email has been sent ✅</h1>
            </div>
            <div class="body">
              <p>Thank you for contacting <strong>Hoffman's Reptiles</strong>! We're happy to hear from you and will reply as soon as we can.</p>
              <p>Want to visit? Tap below for directions, call us, or head back to the homepage.</p>
              <div class="btns">
                <a class="btn" href="${MAP_URL}" target="_blank">🗺️ View Map</a>
                <a class="btn" href="tel:${STORE_PHONE.replace(/[^0-9+]/g,'')}" target="_blank">📞 Call Us</a>
                <a class="btn" href="${SITE_BASE_URL}">🏠 Home</a>
              </div>
              <p style="margin-top:16px;"><strong>Address:</strong> ${STORE_ADDRESS}<br/>
              <strong>Phone:</strong> ${STORE_PHONE}</p>
            </div>
            <div class="muted">Hoffman's Reptiles • ${STORE_ADDRESS}</div>
          </div>
        </div>
      </body>
      </html>
    `);
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

const adminAboutRoutes = require('./admin_about_routes_page');
app.use('/admin', adminAboutRoutes);

// Contact page admin routes
const adminContactRoutes = require('./admin_contact_routes_page');
app.use('/admin', adminContactRoutes);

/* ---------------- DEFAULT & STATIC ---------------- */
app.get('/', (req, res) => res.redirect('/home'));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'public', 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'public', 'robots.txt')));

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
