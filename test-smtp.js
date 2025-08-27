const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: '95aefd001@smtp-brevo.com',
    pass: 'MK0x6SWAYZEm1Nhk', // ✅ this one
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP connection successful:', success);
  }
});
