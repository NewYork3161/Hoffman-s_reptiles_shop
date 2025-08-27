// admin_animals_routes_page.js
const express = require('express');
const router = express.Router();                // ADMIN router (mounted at /admin)
const publicAnimalsRouter = express.Router();   // PUBLIC router (mounted at /)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const AdminAnimalsPage = require('./models/Admin_Animals_Page');

/* ---------------------------------- Utils ---------------------------------- */
function toBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v || '').toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'on' || s === 'yes';
}
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
async function getOrCreatePage() {
  let doc = await AdminAnimalsPage.findOne({});
  if (!doc) {
    doc = new AdminAnimalsPage({});
    await doc.save();
  }
  return doc;
}

/* ------------------------------ File Uploads ------------------------------- */
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const MAX_UPLOAD_MB = 10; // hard limit to prevent huge files
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has((file.mimetype || '').toLowerCase())) {
      return cb(new Error('Only image uploads are allowed (jpg, png, webp, gif).'));
    }
    cb(null, true);
  },
});

/* ================================ ADMIN API ================================ */
/* Mount this router at /admin in your app:
   const { adminRouter, publicAnimalsRouter } = require('./admin_animals_routes_page');
   app.use('/admin', adminRouter);
   app.use(publicAnimalsRouter);
*/

// GET /admin/edit/animals (Editor UI)
router.get('/edit/animals', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    res.render('admin_animals_edit', {
      title: 'Edit Animals - Admin',
      heroUrl: page.heroUrl,
      welcomeText: page.welcomeText,
      animals: page.animals,
      footer: page.footer,
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error('❌ Load animals editor error:', err);
    res.status(500).send('Error loading Animals editor');
  }
});

/* ---------- HERO ---------- */
// PUT /admin/animals/hero
router.put('/animals/hero', upload.single('imageFile'), async (req, res) => {
  try {
    const page = await getOrCreatePage();
    if (req.file) {
      page.heroUrl = '/uploads/' + req.file.filename;
      await page.save();
    }
    res.redirect('/admin/edit/animals?msg=Hero updated#section-hero');
  } catch (err) {
    console.error('❌ Hero update error:', err);
    res.status(500).send('Error updating hero image');
  }
});

/* ---------- WELCOME TEXT ---------- */
// PUT /admin/animals/welcome
router.put('/animals/welcome', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    page.welcomeText = (req.body.text || '').trim();
    await page.save();
    res.redirect('/admin/edit/animals?msg=Welcome text saved#section-welcome');
  } catch (err) {
    console.error('❌ Welcome update error:', err);
    res.status(500).send('Error saving welcome text');
  }
});

/* ---------- GRID: ADD ITEM ---------- */
// POST /admin/animals/items
// Accepts: name, price, available, imageFile, description
router.post('/animals/items', upload.single('imageFile'), async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const { name, price, available, description } = req.body;

    page.animals.push({
      name: (name || '').trim(),
      price: (price || '').trim(),
      available: toBool(available),
      image: req.file ? '/uploads/' + req.file.filename : '',
      description: (description || '').trim(),
    });

    await page.save();
    res.redirect('/admin/edit/animals?msg=Animal added#section-grid');
  } catch (err) {
    console.error('❌ Add animal error:', err);
    res.status(500).send('Error adding animal');
  }
});

/* ---------- GRID: UPDATE ITEM (text OR image OR description) ---------- */
// PUT /admin/animals/items/:id
router.put('/animals/items/:id', upload.single('imageFile'), async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const { id } = req.params;

    // Find by ObjectId if valid, else allow numeric index fallback
    let item = null;
    if (isValidObjectId(id)) {
      item = page.animals.id(id);
    } else {
      const idx = parseInt(id, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < page.animals.length) {
        item = page.animals[idx];
      }
    }
    if (!item) return res.status(404).send('Animal not found');

    if (req.body.__edit === 'imageOnly') {
      if (req.file) item.image = '/uploads/' + req.file.filename;
    } else {
      if (typeof req.body.name !== 'undefined') item.name = (req.body.name || '').trim();
      if (typeof req.body.price !== 'undefined') item.price = (req.body.price || '').trim();
      if (typeof req.body.available !== 'undefined') item.available = toBool(req.body.available);
      if (typeof req.body.description !== 'undefined') item.description = (req.body.description || '').trim();
      if (req.file) item.image = '/uploads/' + req.file.filename; // allow text + new image in one go
    }

    await page.save();
    res.redirect('/admin/edit/animals?msg=Animal updated#section-grid');
  } catch (err) {
    console.error('❌ Update animal error:', err);
    res.status(500).send('Error updating animal');
  }
});

/* ---------- GRID: DELETE ITEM ---------- */
// DELETE /admin/animals/items/:id
router.delete('/animals/items/:id', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const { id } = req.params;

    let removed = false;
    if (isValidObjectId(id)) {
      const item = page.animals.id(id);
      if (item) {
        item.deleteOne();
        removed = true;
      }
    } else {
      const idx = parseInt(id, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < page.animals.length) {
        page.animals.splice(idx, 1);
        removed = true;
      }
    }

    if (removed) await page.save();
    res.redirect('/admin/edit/animals?msg=Animal deleted#section-grid');
  } catch (err) {
    console.error('❌ Delete animal error:', err);
    res.status(500).send('Error deleting animal');
  }
});

/* ---------- FOOTER ---------- */
// PUT /admin/animals/footer
router.put('/animals/footer', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    page.footer = {
      title: (req.body.title || '').trim(),
      text: (req.body.text || '').trim(),
    };
    await page.save();
    res.redirect('/admin/edit/animals?msg=Footer saved#section-footer');
  } catch (err) {
    console.error('❌ Footer update error:', err);
    res.status(500).send('Error saving footer');
  }
});

/* ---------- Multer error handler (ADMIN router only) ---------- */
router.use((err, _req, res, _next) => {
  if (err && (err.name === 'MulterError' || /image uploads/i.test(err.message))) {
    console.error('❌ Upload error:', err);
    return res.status(400).send(err.message || 'Upload error');
    }
  return res.status(500).send('Server error');
});

/* ================================ PUBLIC API =============================== */
/* Mount this router at root:
   app.use(publicAnimalsRouter);
*/

// GET /animals  → render grid page
publicAnimalsRouter.get('/animals', async (_req, res) => {
  try {
    const page = await getOrCreatePage();
    const data = page ? page.toObject() : { animals: [], heroUrl: '', welcomeText: '', footer: {} };
    return res.render('animals', { pageData: data });
  } catch (err) {
    console.error('❌ Public /animals error:', err);
    return res.status(500).send('Error loading animals');
  }
});

// GET /animals/:key  → detail page (key = slugified name OR subdoc _id)
publicAnimalsRouter.get('/animals/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const page = await getOrCreatePage();
    if (!page) return res.status(404).send('Page not found');

    // 1) Try by slugified name
    let animal = page.animals.find(a => slugify(a.name) === key);

    // 2) Fallback by _id (ObjectId or string compare)
    if (!animal) {
      const valid = isValidObjectId(key);
      animal = valid ? page.animals.id(key) : page.animals.find(a => String(a._id) === key);
    }

    if (!animal) return res.status(404).send('Animal not found');
    return res.render('animal_detail', { animal: animal.toObject ? animal.toObject() : animal });
  } catch (err) {
    console.error('❌ Public /animals/:key error:', err);
    return res.status(500).send('Error loading animal');
  }
});

module.exports = {
  adminRouter: router,
  publicAnimalsRouter
};
