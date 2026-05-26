require('dotenv').config();
const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL_USER,
//     clientId: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     refreshToken: process.env.REFRESH_TOKEN,
//   },
// });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"banking-ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Banking Ledger!';
    const text = `Hi ${name},\n\nThank you for registering with Banking Ledger! We're excited to have you on board.\n\nBest regards,\nThe Banking Ledger Team`;
    const html = `<p>Hi ${name},</p><p>Thank you for registering with Banking Ledger! We're excited to have you on board.</p><p>Best regards,<br>The Banking Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, fromAccount, toAccount) {
    const subject = 'Transaction Alert from Banking Ledger';
    const text = `Hi ${name},\n\nA transaction of ${amount} has been made from account ${fromAccount} to account ${toAccount}.\n\nBest regards,\nThe Banking Ledger Team`;
    const html = `<p>Hi ${name},</p><p>A transaction of <strong>${amount}</strong> has been made from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong>.</p><p>Best regards,<br>The Banking Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}
async function sendTransactionfailureEmail(userEmail, name, amount, fromAccount, toAccount, reason) {
    const subject = 'Transaction Failure Alert from Banking Ledger';
    const text = `Hi ${name},\n\nA transaction of ${amount} from account ${fromAccount} to account ${toAccount} has failed. Reason: ${reason}.\n\nBest regards,\nThe Banking Ledger Team`;
    const html = `<p>Hi ${name},</p><p>A transaction of <strong>${amount}</strong> from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong> has failed. Reason: <strong>${reason}</strong>.</p><p>Best regards,<br>The Banking Ledger Team</p>`; 
    
    await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendEmail, sendRegistrationEmail, sendTransactionEmail, sendTransactionfailureEmail };
