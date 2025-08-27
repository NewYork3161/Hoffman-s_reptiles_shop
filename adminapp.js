// adminapp.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

/* ---------------- LOAD ADMIN MODEL ---------------- */
const adminModelPath = path.join(__dirname, 'models', 'AdminUser.js');
if (!fs.existsSync(adminModelPath)) {
  console.error(`❌ AdminUser model missing at ${adminModelPath}`);
}
const AdminUser = fs.existsSync(adminModelPath) ? require(adminModelPath) : null;

/* ---------------- HELPERS ---------------- */
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login?msg=Please%20log%20in');
}

function absoluteUrl(req, suffixPath) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${proto}://${host}${suffixPath}`;
}

function makeMailer() {
  // Use your Gmail + App Password
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hudsonriver4151@gmail.com',
      pass: 'rwyntjdrljkgoyxb', // ✅ Google App Password
    },
  });
}

/* ---------------- ADMIN ROUTES (mounted at /admin) ---------------- */

// Login page
router.get('/login', (req, res) => {
  res.render('AdminLogin', {
    title: 'Admin Login',
    metaDescription: 'Administrator login for site management.',
    metaKeywords: 'admin, login, dashboard',
    msg: req.query.msg || null,
  });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/login?msg=Server%20config%20error');
    const { email, password } = req.body;
    const admin = await AdminUser.findOne({ email: (email || '').trim().toLowerCase() });
    if (!admin || !(await admin.comparePassword(password || ''))) {
      return res.redirect('/admin/login?msg=Invalid%20credentials');
    }
    if (!admin.emailVerified) {
      return res.redirect('/admin/login?msg=Please%20confirm%20your%20email%20first');
    }
    req.session.admin = { id: admin._id.toString(), email: admin.email };
    return req.session.save(err => {
      if (err) {
        console.error('SESSION SAVE ERROR:', err);
        return res.redirect('/admin/login?msg=Session%20error');
      }
      return res.redirect('/admin/dashboard');
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.redirect('/admin/login?msg=Login%20error');
  }
});

// Register page
router.get('/register', (req, res) => {
  res.render('AdminRegister', {
    title: 'Register Admin',
    msg: req.query.msg || null,
  });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/register?msg=Server%20config%20error');

    const { firstName, lastName, phone, email, password, confirm } = req.body;

    if (!firstName || !lastName) {
      return res.redirect('/admin/register?msg=Name%20is%20required');
    }
    if (!phone) {
      return res.redirect('/admin/register?msg=Phone%20is%20required');
    }
    if (password !== confirm) {
      return res.redirect('/admin/register?msg=Passwords%20do%20not%20match');
    }
    const strong = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!strong.test(password)) {
      return res.redirect('/admin/register?msg=Weak%20password');
    }

    const normalizedEmail = (email || '').trim().toLowerCase();
    const existing = await AdminUser.findOne({ email: normalizedEmail });
    if (existing) {
      return res.redirect('/admin/register?msg=Email%20already%20in%20use');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = new AdminUser({
      firstName,
      lastName,
      phone,
      email: normalizedEmail,
      password,
      emailVerified: false,
      emailVerifyToken: token,
      emailVerifyTokenExpiresAt: expires,
    });
    await user.save();

    const verifyLink = absoluteUrl(req, `/admin/verify-email?token=${token}`);
    const transporter = makeMailer();

    await transporter.sendMail({
      from: 'hudsonriver4151@gmail.com',
      to: normalizedEmail,
      subject: 'Confirm your admin account',
      html: `
        <div style="font-family:Arial,sans-serif;padding:16px">
          <h2>Confirm your email</h2>
          <p>Hi ${firstName || 'there'},</p>
          <p>Click the button below to confirm your admin account email.</p>
          <p>
            <a href="${verifyLink}" style="display:inline-block;padding:12px 18px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px">
              Confirm Email
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link:</p>
          <p style="word-break:break-all">${verifyLink}</p>
          <hr/>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
    });

    return res.render('AdminCheckEmail', {
      title: 'Check Your Email',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.redirect('/admin/register?msg=Registration%20error');
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/login?msg=Server%20config%20error');

    const { token } = req.query;
    if (!token) {
      return res.redirect('/admin/login?msg=Missing%20token');
    }

    const now = new Date();
    const user = await AdminUser.findOne({
      emailVerifyToken: token,
      emailVerifyTokenExpiresAt: { $gt: now },
      emailVerified: false,
    });

    if (!user) {
      return res.redirect('/admin/login?msg=Invalid%20or%20expired%20link');
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyTokenExpiresAt = undefined;
    await user.save();

    return res.redirect('/admin/login?msg=Email%20confirmed.%20You%20can%20log%20in%20now.');
  } catch (err) {
    console.error('VERIFY ERROR:', err);
    return res.redirect('/admin/login?msg=Verification%20error');
  }
});

/* ---------------- FORGOT PASSWORD ---------------- */
router.get('/forgot-password', (req, res) => {
  res.render('AdminUpdateLogin', {
    title: 'Update Login',
    msg: req.query.msg || null,
  });
});

// ... keep your forgot-password and reset-password routes unchanged ...

/* ---------------- DELETE ACCOUNT ---------------- */
router.get('/delete-account', (req, res) => {
  res.render('admin_delete_account', {
    title: 'Delete Account',
    msg: req.query.msg || null,
  });
});

// ... keep your delete-account POST route unchanged ...

/* ---------------- OTHER ROUTES ---------------- */
router.get('/update-login', (req, res) => {
  res.render('AdminUpdateLogin', {
    title: 'Update Login',
    msg: req.query.msg || null,
  });
});

router.get('/dashboard', requireAdmin, (req, res) => {
  res.render('admin_dashboard', {
    title: 'Admin Dashboard',
    metaDescription: 'Admin tools',
  });
});

// ✅ NEW: Review Emails page
router.get('/review_emails', requireAdmin, (req, res) => {
  res.render('admin_review_emails', {
    title: 'Review Emails',
    metaDescription: 'View and reply to contact form submissions',
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login?msg=Logged%20out');
  });
});

module.exports = router;
