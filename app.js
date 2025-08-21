// app.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

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

/* ---------------- LOAD ADMIN MODEL (absolute + checks) ---------------- */
const modelsDir = path.join(__dirname, 'models');
const adminModelPath = path.join(modelsDir, 'AdminUser.js');

try {
  console.log('DEBUG models dir exists?', fs.existsSync(modelsDir));
  if (fs.existsSync(modelsDir)) {
    console.log('DEBUG models dir listing:', fs.readdirSync(modelsDir));
  }
  console.log('DEBUG Admin model path:', adminModelPath);
  if (!fs.existsSync(adminModelPath)) {
    throw new Error(`Model file not found at ${adminModelPath}`);
  }
} catch (e) {
  console.error('❌ Model path check failed:', e.message);
  process.exit(1);
}

// IMPORTANT: absolute require so there’s zero ambiguity
const AdminUser = require(adminModelPath);

/* ---------------- VIEW ENGINE ---------------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------------- STATIC ---------------- */
app.use(express.static(path.join(__dirname, 'public')));

/* ---------------- BODY PARSING ---------------- */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// expose logged-in admin to views
app.use((req, res, next) => {
  res.locals.admin = req.session.admin || null;
  next();
});

/* ---------------- AUTH GUARD ---------------- */
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login?msg=Please%20log%20in');
}

/* ---------------- ROUTES ---------------- */

// Home Page
app.get('/home', (req, res) => {
  res.render('index', {
    title: 'Home Page',
    metaDescription: 'Hoffman’s Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.',
    metaKeywords: 'reptiles, snakes, lizards, Concord reptile shop, exotic pets California',
  });
});

// Animals Page
app.get('/animals', (req, res) => {
  res.render('animals', {
    title: 'Animals',
    metaDescription: 'Browse our collection of exotic animals including reptiles, lizards, and snakes.',
    metaKeywords: 'animals, reptiles, exotic pets, lizards, snakes, Concord CA',
  });
});

// Lizards Page
app.get('/lizards', (req, res) => {
  res.render('lizards', {
    title: 'Lizards',
    metaDescription: 'Explore exotic lizards for sale including monitors and iguanas.',
    metaKeywords: 'lizards, monitor lizards, iguanas, Concord reptiles, California reptile shop',
  });
});

// Monitor Lizard Inventory Page
app.get('/monitor_lizard_inventory', (req, res) => {
  res.render('monitor_lizard_inventory', {
    title: 'Monitor Lizard Inventory',
    metaDescription: 'Monitor lizard inventory including Asian water monitors and other species.',
    metaKeywords: 'monitor lizards, Asian water monitor, reptiles for sale Concord CA',
  });
});

// Asian Water Monitor Page
app.get('/asian_water_monitor', (req, res) => {
  res.render('asian_water_monitor', {
    title: 'Asian Water Monitor',
    metaDescription: 'Asian Water Monitors available at Hoffman’s Reptile Shop in Concord, CA.',
    metaKeywords: 'Asian water monitor, monitor lizards, reptiles Concord California',
  });
});

// Gallery Page
app.get('/gallery', (req, res) => {
  res.render('mainGallery', {
    title: 'Gallery',
    metaDescription: 'Photo gallery of reptiles and exotic animals available at Hoffman’s Reptile Shop.',
    metaKeywords: 'reptile gallery, exotic animals, lizards, snakes, Concord CA',
  });
});

// About Page
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us',
    metaDescription: 'Learn about Hoffman’s Reptile Shop in Concord, California.',
    metaKeywords: 'about Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store',
  });
});

// Contact Page
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact',
    metaDescription: 'Contact Hoffman’s Reptile Shop in Concord, CA for exotic reptiles and supplies.',
    metaKeywords: 'contact Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store',
  });
});

/* ---------------- ADMIN LOGIN (MONGOOSE + SESSIONS) ---------------- */

// Render admin login page
app.get('/admin/login', (req, res) => {
  res.render('AdminLogin', {
    title: 'Admin Login',
    metaDescription: 'Administrator login for site management.',
    metaKeywords: 'admin, login, dashboard',
    msg: req.query.msg || null,
  });
});

// Handle admin login POST (checks MongoDB credentials)
app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email: (email || '').trim().toLowerCase() });
    if (!admin) {
      return res.redirect('/admin/login?msg=Invalid%20credentials');
    }

    const ok = await admin.comparePassword(password || '');
    if (!ok) {
      return res.redirect('/admin/login?msg=Invalid%20credentials');
    }

    req.session.admin = { id: admin._id.toString(), email: admin.email };
    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.redirect('/admin/login?msg=Login%20error');
  }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login?msg=Logged%20out');
  });
});

// Protected dashboard (placeholder)
app.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.render('admin_dashboard', {
    title: 'Admin Dashboard',
    metaDescription: 'Admin tools',
  });
});

/* ---------------- CONTACT FORM EMAIL ROUTE ---------------- */
app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  let transporter = nodemailer.createTransport({
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
      html: `
        <div style="font-family: Arial, sans-serif; color:#333; padding:20px; background:#f9f9f9; border-radius:8px;">
          <h2 style="color:#28a745;">Thank you for your interest, ${name || 'Friend'}!</h2>
          <p>We’ve received your message and will get back to you as soon as possible.</p>
          <p><strong>Address:</strong> 2359 Concord Blvd, Concord, CA 94520</p>
          <p><strong>Phone:</strong> (925) 761-9106</p>
          <p><strong>Hours:</strong><br/>Mon–Fri: 12 PM – 6:30 PM<br/>Sat: 10 AM – 5 PM<br/>Sun: Closed</p>
          <p>
            <a href="tel:+19257619106" style="display:inline-block; margin:10px 5px; padding:12px 20px; background:#28a745; color:#fff; text-decoration:none; border-radius:5px;">Call Now</a>
            <a href="https://www.google.com/maps?q=2359+Concord+Blvd,+Concord,+CA+94520" target="_blank" style="display:inline-block; margin:10px 5px; padding:12px 20px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">View Map</a>
          </p>
          <p>Thanks again for reaching out — we appreciate reptile lovers like you!</p>
          <p>– Hoffman's Reptile Shop</p>
        </div>
      `,
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Email Sent</title>
          <meta http-equiv="refresh" content="10;url=/contact" />
          <style>
              body { font-family: Arial, sans-serif; background:#f4f4f4; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
              .message-box { background:#fff; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.2); text-align:center; max-width:500px; }
              h1 { color:#28a745; }
          </style>
      </head>
      <body>
          <div class="message-box">
              <h1>Your Email Has Been Sent!</h1>
              <p>Thank you for your interest in Hoffman's Reptiles.</p>
              <p>You will be redirected back to the Contact page in <strong>10 seconds</strong>.</p>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    res.status(500).send('Error sending message: ' + err.message);
  }
});

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
