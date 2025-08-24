// admin_about_routes_page.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdminAboutPage = require('./models/Admin_About_Page');

// ---- Multer to /public/uploads ----
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ---- helper to get (or create) single about doc ----
async function getDoc() {
  let doc = await AdminAboutPage.findOne({});
  if (!doc) {
    doc = new AdminAboutPage({
      hero: { image: '', title: 'About Us', subtitle: 'Learn more about Hoffman’s Reptiles' },
      content: { title: 'Welcome to Hoffman’s Reptiles', text: '' },
      footer: { title: 'Hoffman’s Reptiles', text: '' },
    });
    await doc.save();
  }
  return doc;
}

/* ================= EDITOR ================= */

// Load editor page
router.get('/edit/about', async (req, res) => {
  try {
    const doc = await getDoc();
    res.render('admin_about_edit', {
      title: 'Edit About Page',
      pageData: doc.toObject(),
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error('❌ GET /admin/edit/about error:', err);
    res.status(500).send('Error loading About editor');
  }
});

/* ================= HERO ================= */

// Replace hero image
router.put('/about/hero', upload.single('imageFile'), async (req, res) => {
  try {
    const doc = await getDoc();
    if (req.file) doc.hero.image = '/uploads/' + req.file.filename;
    await doc.save();
    res.redirect('/admin/edit/about?msg=Hero image updated#section-hero');
  } catch (err) {
    console.error('❌ PUT /admin/about/hero error:', err);
    res.status(500).send('Error updating hero image');
  }
});

// Update hero text
router.put('/about/hero-text', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.hero.title = (req.body.title || '').trim();
    doc.hero.subtitle = (req.body.subtitle || '').trim();
    await doc.save();
    res.redirect('/admin/edit/about?msg=Hero text updated#section-hero');
  } catch (err) {
    console.error('❌ PUT /admin/about/hero-text error:', err);
    res.status(500).send('Error updating hero text');
  }
});

/* ================= CONTENT ================= */

router.put('/about/content', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.content.title = (req.body.title || '').trim();
    doc.content.text = (req.body.text || '').trim();
    await doc.save();
    res.redirect('/admin/edit/about?msg=Content updated#section-content');
  } catch (err) {
    console.error('❌ PUT /admin/about/content error:', err);
    res.status(500).send('Error updating content');
  }
});

/* ================= FOOTER ================= */

router.put('/about/footer', async (req, res) => {
  try {
    const doc = await getDoc();
    doc.footer.title = (req.body.title || '').trim();
    doc.footer.text = (req.body.text || '').trim();
    await doc.save();
    res.redirect('/admin/edit/about?msg=Footer updated#section-footer');
  } catch (err) {
    console.error('❌ PUT /admin/about/footer error:', err);
    res.status(500).send('Error updating footer');
  }
});

/* ================= PUBLISH ================= */

router.post('/about/publish', async (_req, res) => {
  try {
    const doc = await getDoc();
    doc.updatedAt = new Date();
    await doc.save();
    res.redirect('/admin/edit/about?msg=About page published');
  } catch (err) {
    console.error('❌ POST /admin/about/publish error:', err);
    res.status(500).send('Error publishing About page');
  }
});

module.exports = router;
