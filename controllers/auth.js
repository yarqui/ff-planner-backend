const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const gravatar = require("gravatar");
const { nanoid } = require("nanoid");
const { User } = require("../models/user");
const { HttpError, ctrlWrapper, sendSgEmail } = require("../helpers");

const { SECRET_KEY, BASE_URL } = process.env;

const signup = async (req, res) => {
  // First, we check if email is already in use. If it is, we throw custom error message about email in use.
  const { name, email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email is already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // returns a string -> link to generated avatar. 1st argument is email we associate avatar with, 2nd is options object to customize the Gravatar URL
  const avatarURL = gravatar.url(email);
  // create verificationCode for verifying an email after sign up
  const verificationToken = await nanoid();
  // If email is unique, we make a request to create a new user;
  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL,
    verificationToken,
  });

  if (!newUser) {
    throw HttpError(422, "Unprocessable Content");
  }

  const verificationEmail = {
    to: email,
    subject: "Please verify your email",
    html: `<p>Click <a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">here</a> to verify your email: <strong>${email}</strong></p>`,
  };

  // sends verification email
  await sendSgEmail(verificationEmail);

  res.status(201).json({
    user: {
      name,
      email,
    },
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  console.log("✅verificationToken:", verificationToken);
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verified: true,
    verificationToken: "",
  });

  res.status(200).json({ message: "Verification successful" });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw HttpError(400, "Missing required field email");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verificationEmail = {
    to: email,
    subject: "Please verify your email",
    html: `<p>Click <a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">here</a> to verify your email: <strong>${email}</strong></p>`,
  };

  // sends verification email
  await sendEmail.sendSgEmail(verificationEmail);

  res.status(200).json({ message: "Verification email sent" });
};

module.exports = {
  signup: ctrlWrapper(signup),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  //   login: ctrlWrapper(login),
  //   getCurrent: ctrlWrapper(getCurrent),
  //   logout: ctrlWrapper(logout),
  //   updateUserAvatar: ctrlWrapper(updateUserAvatar),
};
