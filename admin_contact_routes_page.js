// admin_contact_routes_page.js
const express = require('express');
const router = express.Router();
const AdminContactPage = require('./models/Admin_Contact_Page');
const nodemailer = require('nodemailer');

/* ---------------- EMAIL CONFIG (put these in .env in production) ---------------- */
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '95b03e001@smtp-brevo.com';
const SMTP_PASS = process.env.SMTP_PASS || '1ahWFd2yUCmDxsQn';

// FROM (must be verified in Brevo if using Brevo) — use a domain you/your client controls
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'no-reply@hoffmansreptiles.com';
const MAIL_FROM_NAME  = process.env.MAIL_FROM_NAME  || "Hoffman's Reptiles";

// OWNER/DESTINATION (JOYCE) — change this per client handoff
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'joyceconnor4151@gmail.com';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

/* Verify SMTP on router load for clear diagnostics */
(async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP ready for contact router');
  } catch (e) {
    console.error('❌ SMTP verify failed (contact router):', e && e.response ? e.response : e);
  }
})();

/* ---- Ensure contact page document exists ---- */
async function getDoc() {
  let doc = await AdminContactPage.findOne({});
  if (!doc) {
    doc = new AdminContactPage({
      info: {
        title: "Contact Hoffman's Reptiles",
        text: "Have a question? Get in touch with Hoffman’s Reptiles today.",
      },
      details: {
        address: "2359 Concord Blvd, Concord, CA 94520",
        phone: "(925) 671-9106",
        email: "info@hoffmansreptiles.com",
        hours: "Saturday 10 AM–5 PM\nSunday Closed\nMonday–Friday 12–6:30 PM",
        mapEmbed: "",
      },
      footer: {
        title: "Hoffman's Reptiles",
        text: "Trusted reptile experts in Concord, CA",
      },
    });
    await doc.save();
  }
  return doc;
}

/* ================= ADMIN EDIT ROUTES ================= */
router.get('/edit/contact', async (req, res) => {
  try {
    const doc = await getDoc();
    res.render('admin_contact_edit', {
      title: 'Edit Contact Page',
      pageData: doc.toObject(),
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error('❌ GET /admin/edit/contact error:', err);
    res.status(500).send('Error loading contact editor');
  }
});

router.put('/contact/info', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.info.title = (req.body.title || '').trim();
    doc.info.text = (req.body.text || '').trim();
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Intro updated#section-info');
  } catch (err) {
    console.error('❌ PUT /admin/contact/info error:', err);
    res.status(500).send('Error updating info section');
  }
});

router.put('/contact/details', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.details = {
      address: (req.body.address || '').trim(),
      phone: (req.body.phone || '').trim(),
      email: (req.body.email || '').trim(),
      hours: (req.body.hours || '').trim(),
      mapEmbed: (req.body.mapEmbed || '').trim(),
    };
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Details updated#section-details');
  } catch (err) {
    console.error('❌ PUT /admin/contact/details error:', err);
    res.status(500).send('Error updating details');
  }
});

router.put('/contact/footer', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.footer.title = (req.body.title || '').trim();
    doc.footer.text = (req.body.text || '').trim();
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Footer updated#section-footer');
  } catch (err) {
    console.error('❌ PUT /admin/contact/footer error:', err);
    res.status(500).send('Error updating footer');
  }
});

router.post('/contact/publish', async (_req, res) => {
  try {
    const doc = await getDoc();
    doc.updatedAt = new Date();
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Contact page published');
  } catch (err) {
    console.error('❌ POST /admin/contact/publish error:', err);
    res.status(500).send('Error publishing contact page');
  }
});

/* ================= CONTACT FORM EMAIL HANDLER ================= */
router.post('/contact/send', async (req, res) => {
  const { name = '', email = '', message = '' } = req.body;

  const storeAddress = '2359 Concord Blvd, Concord, CA 94520';
  const storePhone   = '(925) 671-9106';
  const storeEmail   = 'info@hoffmansreptiles.com';
  const mapUrl       = `https://www.google.com/maps?q=${encodeURIComponent(storeAddress)}`;

  try {
    // 1) Owner notification (JOYCE)
    const ownerMail = await transporter.sendMail({
      from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>`,
      to: OWNER_EMAIL,
      replyTo: email || undefined,
      subject: `📬 New Contact Form — ${name || 'Visitor'}`,
      text:
`Name: ${name}
Email: ${email || '(not provided)'}

Message:
${message || '(No message provided)'}`,
      html: `
        <div style="font-family:sans-serif;padding:16px;">
          <h3>📨 New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name || '(not provided)'}</p>
          <p><strong>Email:</strong> ${email ? `<a href="mailto:${email}">${email}</a>` : '(not provided)'}</p>
          <p><strong>Message:</strong><br>${(message || '(No message provided)').replace(/\n/g, '<br>')}</p>
        </div>`
    });
    console.log('✅ Owner email accepted by SMTP:', ownerMail && ownerMail.messageId);

    // 2) Auto-reply to customer (if email present)
    if (email) {
      const userMail = await transporter.sendMail({
        from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>`,
        to: email,
        subject: "Thanks for contacting Hoffman's Reptiles!",
        text:
`Hi ${name || 'Friend'},

Thanks for reaching out! We'll get back to you soon.

Store Info:
${storeAddress}
${storePhone}
${storeEmail}

Map: ${mapUrl}
`,
        html: `
          <div style="background:#000;color:#14532d;font-family:sans-serif;padding:24px;border-radius:10px;">
            <h2 style="color:#14532d;">Welcome to Hoffman's Reptiles!</h2>
            <p>Hi ${name || 'Friend'},</p>
            <p>We're glad you reached out! We'll get back to you as soon as we can.</p>
            <hr style="border-color:#14532d;margin:20px 0;" />
            <p><strong>📍 Address:</strong> ${storeAddress}</p>
            <p><strong>📞 Phone:</strong> ${storePhone}</p>
            <p><strong>📧 Email:</strong> ${storeEmail}</p>
            <p><strong>🕒 Hours:</strong><br>
              Saturday: 10 AM–5 PM<br>
              Sunday: Closed<br>
              Monday–Friday: 12–6:30 PM
            </p>
            <div style="margin-top:24px;">
              <a href="${mapUrl}" target="_blank" style="background:#14532d;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
                View Map
              </a>
            </div>
            <p style="margin-top:30px;font-size:12px;color:#999;">We appreciate your interest in Hoffman's Reptiles.</p>
          </div>`
      });
      console.log('✅ User email accepted by SMTP:', userMail && userMail.messageId);
    }

    // Match your app's success route
    res.redirect('/contact/success');
  } catch (err) {
    console.error('❌ EMAIL ERROR (contact/send):', err && err.response ? err.response : err);
    res.redirect('/contact?msg=Error sending message');
  }
});

module.exports = router;
