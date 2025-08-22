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
  console.warn('⚠️ Could not load ./models/Admin_Home_Page. Make sure the file exists and the name matches.');
}

/* ---------------- VIEW ENGINE ---------------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- STATIC ---------------- */
app.use(express.static(path.join(__dirname, 'public')));

/* ---------------- BODY PARSING ---------------- */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* ---------------- METHOD OVERRIDE ---------------- */
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

/* ---------------- PUBLIC ROUTES ---------------- */

// Home Page (now loads data from DB and always defines pageData)
app.get('/home', async (req, res) => {
  try {
    let pageData = null;
    if (AdminHomePage) {
      pageData = await AdminHomePage.findOne({}).lean();
    }
    res.render('index', {
      title: 'Home Page',
      metaDescription:
        'Hoffman’s Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.',
      metaKeywords:
        'reptiles, snakes, lizards, Concord reptile shop, exotic pets California',
      pageData: pageData || null,
    });
  } catch (err) {
    console.error('❌ Error loading /home:', err);
    res.render('index', {
      title: 'Home Page',
      metaDescription:
        'Hoffman’s Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.',
      metaKeywords:
        'reptiles, snakes, lizards, Concord reptile shop, exotic pets California',
      pageData: null,
    });
  }
});

// Animals Page
app.get('/animals', (req, res) => {
  res.render('animals', {
    title: 'Animals',
    metaDescription:
      'Browse our collection of exotic animals including reptiles, lizards, and snakes.',
    metaKeywords: 'animals, reptiles, exotic pets, lizards, snakes, Concord CA',
  });
});

// Lizards Page
app.get('/lizards', (req, res) => {
  res.render('lizards', {
    title: 'Lizards',
    metaDescription:
      'Explore exotic lizards for sale including monitors and iguanas.',
    metaKeywords:
      'lizards, monitor lizards, iguanas, Concord reptiles, California reptile shop',
  });
});

// Monitor Lizard Inventory Page
app.get('/monitor_lizard_inventory', (req, res) => {
  res.render('monitor_lizard_inventory', {
    title: 'Monitor Lizard Inventory',
    metaDescription:
      'Monitor lizard inventory including Asian water monitors and other species.',
    metaKeywords:
      'monitor lizards, Asian water monitor, reptiles for sale Concord CA',
  });
});

// Asian Water Monitor Page
app.get('/asian_water_monitor', (req, res) => {
  res.render('asian_water_monitor', {
    title: 'Asian Water Monitor',
    metaDescription:
      'Asian Water Monitors available at Hoffman’s Reptile Shop in Concord, CA.',
    metaKeywords:
      'Asian water monitor, monitor lizards, reptiles Concord California',
  });
});

// Gallery Page
app.get('/gallery', (req, res) => {
  res.render('mainGallery', {
    title: 'Gallery',
    metaDescription:
      'Photo gallery of reptiles and exotic animals available at Hoffman’s Reptile Shop.',
    metaKeywords:
      'reptile gallery, exotic animals, lizards, snakes, Concord CA',
  });
});

// About Page
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us',
    metaDescription:
      'Learn about Hoffman’s Reptile Shop in Concord, California.',
    metaKeywords:
      'about Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store',
  });
});

// Contact Page
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact',
    metaDescription:
      'Contact Hoffman’s Reptile Shop in Concord, CA for exotic reptiles and supplies.',
    metaKeywords:
      'contact Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store',
  });
});

/* ---------------- CONTACT FORM EMAIL ROUTE ---------------- */
app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hudsonriver4151@gmail.com',
      pass: 'hols yaqs wxdk nfyl', // Google App Password
    },
  });

  try {
    await transporter.sendMail({
      from: email,
      to: 'hudsonriver4151@gmail.com',
      subject: `Message from ${name}`,
      text: message,
      replyTo: email,
    });

    await transporter.sendMail({
      from: 'hudsonriver4151@gmail.com',
      to: email,
      subject: "Thanks for contacting Hoffman's Reptile Shop!",
      html: `<p>Thanks ${name || 'Friend'}! We’ll get back to you soon.</p>`,
    });

    res.send('<h1>Email sent successfully!</h1>');
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    res.status(500).send('Error sending message: ' + err.message);
  }
});

/* ---------------- ADMIN ROUTES ---------------- */

// main admin system
const adminRouter = require('./adminapp');
app.use('/admin', adminRouter);

// dynamic "edit page" routes
const adminRoutesPage = require('./admin_routes_page');
app.use('/admin', adminRoutesPage);

// admin home editor routes (point to same file since that’s the one you have)
const adminHomeRoutes = require('./admin_routes_page');
app.use('/admin', adminHomeRoutes);

/* ---------------- DEFAULT & STATIC ---------------- */
app.get('/', (req, res) => res.redirect('/home'));

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
