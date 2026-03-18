const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (options) => {
    // 1) Create a transporter
    // For production, you would configure this with a real SMTP service (e.g., SendGrid, Mailgun)
    // Or a Gmail account with an App Password
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false, // false = STARTTLS (required for port 587 on Mailtrap)
        auth: {
            user: "e1e42963e43aa8",//process.env.EMAIL_USERNAME,
            pass: "afa094bd81ebd8",//process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false // allow self-signed certs in dev
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'Super Bot Assistant Team <hello@superbot.com>',
        to: options.email,
        subject: 'Welcome to Super Bot Assistant!',
        text: `from team Super Bot Assistant thank you for creating account with super bot`,
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                <h2>Welcome to Super Bot Assistant! 🤖</h2>
                <p>Hi ${options.name},</p>
                <p>from team Super Bot Assistant thank you for creating account with super bot.</p>
                <p>We are excited to have you on board. Start chatting and exploring the AI capabilities!</p>
                <br>
                <p>Best Regards,</p>
                <p><strong>Super Bot Team</strong></p>
            </div>
        `
    };

    // 3) Actually send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully to', options.email);
    } catch (err) {
        console.error('Error sending welcome email:', err);
    }
};

module.exports = sendWelcomeEmail;
