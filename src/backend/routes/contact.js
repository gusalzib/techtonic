const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

try {
console.log("EMAIL:", process.env.CONTACT_EMAIL);
console.log("PASS EXISTS:", !!process.env.CONTACT_EMAIL_PASSWORD);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.CONTACT_EMAIL,
        pass: process.env.CONTACT_EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: 'Techtonic',
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: message,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>${message}</p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router
