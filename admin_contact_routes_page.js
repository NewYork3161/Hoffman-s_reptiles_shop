// admin_contact_routes_page.js
const express = require('express');
const router = express.Router();
const AdminContactPage = require('./models/Admin_Contact_Page');
const EmailMessage = require('./models/Email_Message_Page'); // schema for contact form messages
const nodemailer = require('nodemailer');

/* ---------------- GMAIL + APP PASSWORD CONFIG ---------------- */
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465; // SSL (required for Gmail)
const SMTP_USER = "hudsonriver4151@gmail.com";   // Gmail login
const SMTP_PASS = "btyehlpkfaleqpsx";            // ⚠️ Replace with your new App Password

/* ---------------- EMAIL IDENTITIES ---------------- */
const MAIL_FROM_EMAIL = SMTP_USER;                // send FROM the Gmail you authenticate with
const MAIL_FROM_NAME  = "Hoffman's Reptiles";
const OWNER_EMAIL     = "hudsonriver4151@gmail.com"; // where customer messages go

/* ---------------- SETUP NODEMAILER ---------------- */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true, // SSL
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Verify transporter once on load
(async () => {
  try {
    await transporter.verify();
    console.log("✅ Gmail SMTP ready for contact router");
  } catch (e) {
    console.error("❌ Gmail SMTP verify failed:", e);
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

/* ================= ADMIN ROUTES ================= */

// ✅ Edit Contact Page
router.get('/edit/contact', async (req, res) => {
  try {
    const doc = await getDoc();
    res.render('admin_contact_edit', {
      title: 'Edit Contact Page',
      pageData: doc.toObject(),
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error("❌ GET /admin/edit/contact error:", err);
    res.status(500).send("Error loading contact editor");
  }
});

// ✅ Review Emails page
router.get('/review_emails', async (req, res) => {
  try {
    const emails = await EmailMessage.find().sort({ createdAt: -1 });
    res.render('admin_review_emails', {
      title: 'Review Emails',
      emails,
    });
  } catch (err) {
    console.error("❌ GET /admin/review_emails error:", err);
    res.status(500).send("Error loading review emails");
  }
});

/* -------- PUT Routes for editing contact -------- */
router.put('/contact/info', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.info.title = (req.body.title || "").trim();
    doc.info.text  = (req.body.text  || "").trim();
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Intro updated#section-info');
  } catch (err) {
    console.error("❌ PUT /admin/contact/info error:", err);
    res.status(500).send("Error updating info section");
  }
});

router.put('/contact/details', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.details = {
      address: (req.body.address || "").trim(),
      phone:   (req.body.phone   || "").trim(),
      email:   (req.body.email   || "").trim(),
      hours:   (req.body.hours   || "").trim(),
      mapEmbed:(req.body.mapEmbed|| "").trim(),
    };
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Details updated#section-details');
  } catch (err) {
    console.error("❌ PUT /admin/contact/details error:", err);
    res.status(500).send("Error updating details");
  }
});

router.put('/contact/footer', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.footer.title = (req.body.title || "").trim();
    doc.footer.text  = (req.body.text  || "").trim();
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Footer updated#section-footer');
  } catch (err) {
    console.error("❌ PUT /admin/contact/footer error:", err);
    res.status(500).send("Error updating footer");
  }
});

router.post('/contact/publish', async (_req, res) => {
  try {
    const doc = await getDoc();
    doc.updatedAt = new Date();
    await doc.save();
    res.redirect('/admin/edit/contact?msg=Contact page published');
  } catch (err) {
    console.error("❌ POST /admin/contact/publish error:", err);
    res.status(500).send("Error publishing contact page");
  }
});

/* ================= CONTACT FORM HANDLER ================= */
router.post('/contact/send', async (req, res) => {
  const { name = "", email = "", message = "" } = req.body;

  try {
    // ✅ Save message for Review Emails page (map to schema fields)
    const newMessage = new EmailMessage({
      Full_Name: (name || "").trim(),
      Email: (email || "").trim(),
      Message: (message || "").trim(),
    });
    await newMessage.save();

    // ✅ Notify owner
    await transporter.sendMail({
      from: `"${MAIL_FROM_NAME}" <${SMTP_USER}>`, // must match authenticated Gmail
      to: OWNER_EMAIL,
      replyTo: email || undefined,
      subject: `📬 New Contact Form — ${name || "Visitor"}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:sans-serif;padding:16px;">
          <h3>📨 New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${
            email ? `<a href="mailto:${email}">${email}</a>` : "(not provided)"
          }</p>
          <p><strong>Message:</strong><br>${(message || "").replace(/\n/g,"<br>")}</p>
        </div>`,
    });

    // ✅ Auto-reply to sender
    if (email) {
      await transporter.sendMail({
        from: `"${MAIL_FROM_NAME}" <${SMTP_USER}>`,
        to: email,
        replyTo: OWNER_EMAIL,
        subject: "Thanks for contacting Hoffman's Reptiles!",
        text: `Hi ${name || "Friend"},\n\nThanks for reaching out! We'll get back to you soon.\n\n-Hoffman's Reptiles`,
        html: `
          <div style="font-family:sans-serif;padding:20px;background:#000;color:#28a745;">
            <h2 style="color:#28a745;">Thanks for contacting Hoffman's Reptiles!</h2>
            <p>Hi ${name || "Friend"},</p>
            <p>We're glad you reached out! We'll get back to you as soon as we can.</p>
            <hr/>
            <p>Hoffman's Reptiles Team</p>
          </div>`,
      });
    }

    // ✅ Redirect to success confirmation page
    res.redirect('/contact?msg=success');
  } catch (err) {
    console.error("❌ EMAIL ERROR (contact/send):", err);
    res.redirect('/contact?msg=Error sending message');
  }
});

/* ================= ADMIN CHECK EMAILS PAGE ================= */
router.get('/check_emails', async (req, res) => {
  try {
    const emails = await EmailMessage.find().sort({ createdAt: -1 });
    res.render('admin_check_emails', {
      title: 'Check Your Emails',
      emails,
    });
  } catch (err) {
    console.error("❌ GET /admin/check_emails error:", err);
    res.status(500).send("Error loading emails");
  }
});

/* ================= DELETE EMAIL ROUTES ================= */

// Delete one email by ID
router.post('/review_emails/:id/delete', async (req, res) => {
  try {
    await EmailMessage.findByIdAndDelete(req.params.id);
    res.redirect('/admin/review_emails?msg=Email deleted');
  } catch (err) {
    console.error("❌ DELETE single email error:", err);
    res.redirect('/admin/review_emails?msg=Error deleting email');
  }
});

// Delete all emails
router.post('/review_emails/delete_all', async (req, res) => {
  try {
    await EmailMessage.deleteMany({});
    res.redirect('/admin/review_emails?msg=All emails deleted');
  } catch (err) {
    console.error("❌ DELETE all emails error:", err);
    res.redirect('/admin/review_emails?msg=Error deleting all emails');
  }
});

module.exports = router;
