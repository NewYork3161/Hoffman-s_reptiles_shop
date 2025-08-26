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

router.post('/forgot-password', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/update-login?msg=Server%20config%20error');
    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await AdminUser.findOne({ email: normalizedEmail });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 1); // 1 hour
      user.resetToken = token;
      user.resetTokenExpiresAt = expires;
      await user.save();

      const resetLink = absoluteUrl(req, `/admin/reset-password?token=${token}`);
      const transporter = makeMailer();

      await transporter.sendMail({
        from: 'hudsonriver4151@gmail.com',
        to: normalizedEmail,
        subject: 'Reset your admin password',
        html: `
          <div style="font-family:Arial,sans-serif;padding:16px">
            <h2>Reset your password</h2>
            <p>Click the button below to set a new password.</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px">
                Reset Password
              </a>
            </p>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p style="word-break:break-all">${resetLink}</p>
            <hr/>
            <p>This link expires in 1 hour.</p>
          </div>
        `,
      });
    }

    return res.render('AdminCheckEmail', {
      title: 'Check Your Email',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    return res.redirect('/admin/update-login?msg=Something%20went%20wrong');
  }
});

/* ---------------- RESET PASSWORD ---------------- */
router.get('/reset-password', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/login?msg=Server%20config%20error');
    const { token } = req.query;
    if (!token) return res.redirect('/admin/login?msg=Missing%20token');

    const now = new Date();
    const user = await AdminUser.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: now },
    });
    if (!user) {
      return res.redirect('/admin/login?msg=Invalid%20or%20expired%20link');
    }

    return res.render('AdminResetPassword', {
      title: 'Update Password',
      token,
      email: user.email,
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error('RESET PAGE ERROR:', err);
    return res.redirect('/admin/login?msg=Reset%20error');
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/login?msg=Server%20config%20error');
    const { token, password, confirm } = req.body;

    if (!token) return res.redirect('/admin/login?msg=Missing%20token');
    if (password !== confirm) {
      return res.redirect(`/admin/reset-password?token=${encodeURIComponent(token)}&msg=Passwords%20do%20not%20match`);
    }
    const strong = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!strong.test(password)) {
      return res.redirect(`/admin/reset-password?token=${encodeURIComponent(token)}&msg=Weak%20password`);
    }

    const now = new Date();
    const user = await AdminUser.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: now },
    });
    if (!user) {
      return res.redirect('/admin/login?msg=Invalid%20or%20expired%20link');
    }

    const isSameAsOld = await user.comparePassword(password);
    if (isSameAsOld) {
      return res.redirect(`/admin/reset-password?token=${encodeURIComponent(token)}&msg=Cannot%20reuse%20old%20password`);
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    return res.redirect('/admin/login?msg=Password%20updated.%20Please%20login.');
  } catch (err) {
    console.error('RESET SUBMIT ERROR:', err);
    return res.redirect('/admin/login?msg=Reset%20error');
  }
});

/* ---------------- FORGOT EMAIL ---------------- */
router.post('/forgot-email', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/update-login?msg=Server%20config%20error');
    const { phone } = req.body;

    const user = await AdminUser.findOne({ phone: (phone || '').trim() });
    if (!user) {
      return res.redirect('/admin/update-login?msg=Phone%20not%20found');
    }

    const transporter = makeMailer();
    await transporter.sendMail({
      from: 'hudsonriver4151@gmail.com',
      to: user.email,
      subject: 'Your Admin Account Information',
      html: `
        <div style="font-family:Arial,sans-serif;padding:16px">
          <h2>Account Recovery</h2>
          <p>Hello ${user.firstName || 'Admin'},</p>
          <p>You requested account recovery using your phone number.</p>
          <p><b>Email:</b> ${user.email}</p>
          <p>If you did not request this, please ignore this message.</p>
        </div>
      `,
    });

    return res.render('AdminCheckEmail', {
      title: 'Check Your Email',
      email: user.email,
    });
  } catch (err) {
    console.error('FORGOT EMAIL ERROR:', err);
    return res.redirect('/admin/update-login?msg=Recovery%20error');
  }
});

/* ---------------- DELETE ACCOUNT ---------------- */
router.get('/delete-account', (req, res) => {
  res.render('admin_delete_account', {
    title: 'Delete Account',
    msg: req.query.msg || null,
  });
});

router.post('/delete-account', async (req, res) => {
  try {
    if (!AdminUser) return res.redirect('/admin/login?msg=Server%20config%20error');

    const { firstName = '', lastName = '', email = '', phone = '', password = '' } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedPhone = (phone || '').trim();

    const user =
      (normalizedEmail && await AdminUser.findOne({ email: normalizedEmail })) ||
      (normalizedPhone && await AdminUser.findOne({ phone: normalizedPhone }));

    if (!user) {
      return res.redirect('/admin/delete-account?msg=Account%20not%20found');
    }

    if (firstName && user.firstName !== firstName) {
      return res.redirect('/admin/delete-account?msg=First%20name%20does%20not%20match');
    }
    if (lastName && user.lastName !== lastName) {
      return res.redirect('/admin/delete-account?msg=Last%20name%20does%20not%20match');
    }
    if (normalizedPhone && user.phone !== normalizedPhone) {
      return res.redirect('/admin/delete-account?msg=Phone%20number%20does%20not%20match');
    }

    const ok = await user.comparePassword(password || '');
    if (!ok) {
      return res.redirect('/admin/delete-account?msg=Incorrect%20password');
    }

    if (req.session?.admin?.id === String(user._id)) {
      req.session.destroy(() => {});
    }

    await AdminUser.deleteOne({ _id: user._id });

    return res.redirect('/admin/login?msg=Account%20deleted');
  } catch (err) {
    console.error('DELETE ACCOUNT ERROR:', err);
    return res.redirect('/admin/delete-account?msg=Delete%20failed');
  }
});

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

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login?msg=Logged%20out');
  });
});

module.exports = router;
