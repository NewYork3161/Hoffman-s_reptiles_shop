const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Dynamic port for Render

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for Home Page
app.get('/home', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

// Default route redirects to /home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Serve sitemap.xml explicitly
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Serve robots.txt explicitly
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
