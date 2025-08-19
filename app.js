const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for Home Page
app.get('/home', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

// Animals Page
app.get('/animals', (req, res) => {
    res.render('animals', { title: 'Animals' });
});

// Individual Animal Pages
app.get('/lizards', (req, res) => {
    res.render('lizards', { title: 'Lizards' });
});
app.get('/snakes', (req, res) => {
    res.render('snakes', { title: 'Snakes' });
});
app.get('/turtles', (req, res) => {
    res.render('turtles', { title: 'Turtles' });
});
app.get('/tortoises', (req, res) => {
    res.render('tortoises', { title: 'Tortoises' });
});
app.get('/frogs', (req, res) => {
    res.render('frogs', { title: 'Frogs' });
});
app.get('/rats', (req, res) => {
    res.render('rats', { title: 'Rats' });
});
app.get('/tarantulas', (req, res) => {
    res.render('tarantulas', { title: 'Tarantulas' });
});
app.get('/newts', (req, res) => {
    res.render('newts', { title: 'Newts' });
});
app.get('/salamanders', (req, res) => {
    res.render('salamanders', { title: 'Salamanders' });
});

// Gallery Page
app.get('/gallery', (req, res) => {
    res.render('gallery', { title: 'Gallery' });
});

// About Page
app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

// Contact Page
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact' });
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
