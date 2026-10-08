require('dotenv').config();
const { configurationStatus, checkBrevoAccount, sendBrevoTestEmail } = require('../src/services/email');

(async () => {
  try {
    const status = configurationStatus();
    if (!status.configured) {
      console.error('Brevo is not configured. Add BREVO_API_KEY and a verified BREVO_SENDER_EMAIL to backend/.env.');
      process.exit(1);
    }

    const account = await checkBrevoAccount();
    console.log('Brevo API connection OK.');
    if (account.email) console.log(`Brevo account: ${account.email}`);
    console.log(`Sender configured: ${status.sender_name} <${status.sender_email}>`);

    const testEmail = String(process.env.BREVO_TEST_EMAIL || '').trim();
    if (testEmail) {
      await sendBrevoTestEmail(testEmail);
      console.log(`Test email queued for ${testEmail}.`);
    } else {
      console.log('Optional: set BREVO_TEST_EMAIL in backend/.env to send a real test email.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Brevo setup check failed:', err.message);
    console.error('Tip: verify that BREVO_API_KEY is active and BREVO_SENDER_EMAIL is verified in Brevo.');
    process.exit(1);
  }
})();
