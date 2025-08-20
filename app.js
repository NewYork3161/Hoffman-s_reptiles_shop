const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for form submissions
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ---------------- ROUTES ---------------- //

// Home Page
app.get('/home', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

// Animals Page
app.get('/animals', (req, res) => {
    res.render('animals', { title: 'Animals' });
});

// Lizards Page
app.get('/lizards', (req, res) => {
    res.render('lizards', { title: 'Lizards' });
});



// Gallery Page
app.get('/gallery', (req, res) => {
    res.render('mainGallery', { title: 'Gallery' });
});

// About Page
app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

// Contact Page
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact' });
});

// ---------------- CONTACT FORM EMAIL ROUTE ---------------- //
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hudsonriver4151@gmail.com',
            pass: 'hols yaqs wxdk nfyl'  // 16-character Google App Password
        }
    });

    try {
        // 1. Send email to YOU
        await transporter.sendMail({
            from: email,
            to: 'hudsonriver4151@gmail.com',
            subject: `Message from ${name}`,
            text: message,
            replyTo: email
        });

        // 2. Auto-reply back to customer
        await transporter.sendMail({
            from: 'hudsonriver4151@gmail.com',
            to: email,
            subject: "🐍 Thanks for contacting Hoffman's Reptile Shop!",
            html: `
                <div style="font-family: Arial, sans-serif; color:#333; padding:20px; background:#f9f9f9; border-radius:8px;">
                    <h2 style="color:#28a745;">Thank you for your interest, ${name || "Friend"}! 🦎</h2>
                    <p>We’ve received your message and will get back to you as soon as possible.</p>
                    <p><strong>📍 Address:</strong> 2359 Concord Blvd, Concord, CA 94520</p>
                    <p><strong>📞 Phone:</strong> (925) 761-9106</p>
                    <p><strong>🕒 Hours:</strong><br/>Mon–Fri: 12 PM – 6:30 PM<br/>Sat: 10 AM – 5 PM<br/>Sun: Closed</p>
                    <p>
                        <a href="tel:+19257619106" style="display:inline-block; margin:10px 5px; padding:12px 20px; background:#28a745; color:#fff; text-decoration:none; border-radius:5px;">
                            📞 Call Now
                        </a>
                        <a href="https://www.google.com/maps?q=2359+Concord+Blvd,+Concord,+CA+94520" target="_blank"
                           style="display:inline-block; margin:10px 5px; padding:12px 20px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">
                            📍 View Map
                        </a>
                    </p>
                    <p>🐊 Thanks again for reaching out — we appreciate reptile lovers like you!</p>
                    <p>– Hoffman's Reptile Shop</p>
                </div>
            `
        });

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Email Sent</title>
                <meta http-equiv="refresh" content="10;url=/contact" />
                <style>
                    body { font-family: Arial, sans-serif; background:#f4f4f4; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
                    .message-box { background:#fff; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.2); text-align:center; max-width:500px; }
                    h1 { color:#28a745; }
                </style>
            </head>
            <body>
                <div class="message-box">
                    <h1>✅ Your Email Has Been Sent!</h1>
                    <p>Thank you for your interest in Hoffman's Reptiles.</p>
                    <p>You will be redirected back to the Contact page in <strong>10 seconds</strong>.</p>
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        console.error("EMAIL ERROR:", err);
        res.status(500).send("❌ Error sending message: " + err.message);
    }
});

// ---------------- DEFAULT & STATIC ---------------- //

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

// ---------------- START SERVER ---------------- //
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
