// admin_gallery_routes_page.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const methodOverride = require('method-override');

const AdminGalleryPage = require('./models/Admin_Gallery_Page');

router.use(methodOverride('_method'));
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* ---------- uploads ---------- */
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ---------- helpers ---------- */
const DEFAULT_DOC = {
  info: { title: 'Gallery', text: '' },
  images: [],
  footer: { title: "Hoffman's Reptiles", text: '' },
};

async function ensureDoc() {
  return AdminGalleryPage.findOneAndUpdate(
    {},
    { $setOnInsert: DEFAULT_DOC },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

/* ---------- EDIT SCREEN ---------- */
router.get('/edit/gallery', async (req, res) => {
  try {
    const doc = await ensureDoc();
    res.render('admin_gallery_edit', {
      title: 'Edit Gallery - Admin',
      pageData: doc,
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error('❌ GET /admin/edit/gallery error:', err);
    res.status(500).send('Error loading Gallery editor');
  }
});

/* ---------- INFO ---------- */
async function handleInfo(req, res) {
  try {
    const title = (req.body.title || '').trim();
    const text = (req.body.text || '').trim();

    await AdminGalleryPage.findOneAndUpdate(
      {},
      { $set: { 'info.title': title, 'info.text': text } },
      { upsert: true }
    );

    res.redirect('/admin/edit/gallery?msg=Info+updated#section-info');
  } catch (err) {
    console.error('❌ /admin/gallery/info error:', err);
    res.status(500).send('Error updating info section');
  }
}
router.put('/gallery/info', handleInfo);
router.post('/gallery/info', handleInfo);

/* ---------- IMAGE GRID ---------- */
async function handleAddImage(req, res) {
  try {
    if (req.file) {
      await AdminGalleryPage.findOneAndUpdate(
        {},
        { $push: { images: '/uploads/' + req.file.filename } },
        { upsert: true }
      );
    }
    res.redirect('/admin/edit/gallery?msg=Image+added#section-grid');
  } catch (err) {
    console.error('❌ POST /admin/gallery/images error:', err);
    res.status(500).send('Error adding gallery image');
  }
}
router.post('/gallery/images', upload.single('imageFile'), handleAddImage);

async function handleReplaceImage(req, res) {
  try {
    const idx = parseInt(req.params.index, 10);
    if (Number.isNaN(idx) || !req.file) {
      return res.redirect('/admin/edit/gallery?msg=No+file#section-grid');
    }
    const set = {};
    set[`images.${idx}`] = '/uploads/' + req.file.filename;
    await AdminGalleryPage.findOneAndUpdate({}, { $set: set }, { upsert: true });
    res.redirect('/admin/edit/gallery?msg=Image+updated#section-grid');
  } catch (err) {
    console.error('❌ PUT /admin/gallery/images/:index error:', err);
    res.status(500).send('Error updating gallery image');
  }
}
router.put('/gallery/images/:index', upload.single('imageFile'), handleReplaceImage);
router.post('/gallery/images/:index', upload.single('imageFile'), handleReplaceImage);

async function handleDeleteImage(req, res) {
  try {
    const idx = parseInt(req.params.index, 10);
    const doc = await AdminGalleryPage.findOne({});
    if (doc && Array.isArray(doc.images) && idx >= 0 && idx < doc.images.length) {
      doc.images.splice(idx, 1);
      await doc.save();
    }
    res.redirect('/admin/edit/gallery?msg=Image+deleted#section-grid');
  } catch (err) {
    console.error('❌ DELETE /admin/gallery/images/:index error:', err);
    res.status(500).send('Error deleting gallery image');
  }
}
router.delete('/gallery/images/:index', handleDeleteImage);
router.post('/gallery/images/:index/delete', handleDeleteImage);

/* ---------- FOOTER ---------- */
async function handleFooter(req, res) {
  try {
    const title = (req.body.title || '').trim();
    const text = (req.body.text || '').trim();

    await AdminGalleryPage.findOneAndUpdate(
      {},
      { $set: { 'footer.title': title, 'footer.text': text } },
      { upsert: true }
    );

    res.redirect('/admin/edit/gallery?msg=Footer+saved#section-footer');
  } catch (err) {
    console.error('❌ /admin/gallery/footer error:', err);
    res.status(500).send('Error saving footer');
  }
}
router.put('/gallery/footer', handleFooter);
router.post('/gallery/footer', handleFooter);

/* ---------- PUBLISH ---------- */
router.post('/gallery/publish', async (_req, res) => {
  try {
    await AdminGalleryPage.findOneAndUpdate(
      {},
      { $set: { publishedAt: new Date() }, $setOnInsert: DEFAULT_DOC },
      { upsert: true }
    );
    res.redirect('/admin/edit/gallery?msg=Published#top');
  } catch (err) {
    console.error('❌ POST /admin/gallery/publish error:', err);
    res.status(500).send('Error publishing page');
  }
});

module.exports = router;
