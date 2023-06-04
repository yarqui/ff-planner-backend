require("dotenv").config({ path: "../.env" });
const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, SG_EMAIL_SENDER } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendSgEmail = async (data) => {
  // data is 'to', 'subject', 'html', 'text' etc.
  const message = { ...data, from: SG_EMAIL_SENDER };
  try {
    await sgMail.send(message);
  } catch (error) {
    console.log("error:", error);
    console.log("error.message:", error.message);
  }

  console.log("email sent via sendgrid");
  // we return true, if the error occurs, controller will handle it
  return true;
};

module.exports = sendSgEmail;
