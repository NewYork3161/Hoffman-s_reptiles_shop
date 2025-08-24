// admin_contact_routes_page.js
const express = require('express');
const router = express.Router();
const AdminContactPage = require('./models/Admin_Contact_Page');

// ---- helper to get (or create) single doc ----
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
        hours: "Mon–Fri: 12pm–6:30pm\nSat: 10am–5pm\nSun: Closed",
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

/* ================= EDITOR ================= */
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

/* ================= INFO ================= */
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

/* ================= DETAILS ================= */
router.put('/contact/details', async (req, res) => {
  try {
    const doc = await getDoc();

    // overwrite details object fully to avoid nested save issues
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

/* ================= FOOTER ================= */
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

/* ================= PUBLISH ================= */
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

module.exports = router;
