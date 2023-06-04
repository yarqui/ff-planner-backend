const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  console.log("user:", user);
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verified) {
    throw HttpError(401, "Email is not verified");
  }

  // compares if password in DB is the same as password in request. If it is, it returns true.
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  // creates a payload to generate token, usually it's an id. !!!It's forbidden to save secret data in payload, because it's easy to decode a token
  const payload = {
    id: user._id,
  };
  // jwt.sign() has 1st arg - payload, 2nd - secret_key, 3rd - options object, like token expiration time
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

  // adds token field to user document
  await User.findByIdAndUpdate(user._id, { token });

  // checks token expiration, and whether this token was encrypted using this SECRET_KEY. Throws an error, if token is expired. that's why we should use try catch. If token is valid, it returns our payload - in our case "id" of the user.
  try {
    const { id } = jwt.verify(token, SECRET_KEY); // eslint-disable-line
  } catch (error) {
    console.log(error.message);
  }

  res.status(200).json({
    token,
    user: { email: user.email },
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });

  res.status(204).json();
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
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
  await sendSgEmail(verificationEmail);

  res.status(200).json({ message: "Verification email sent" });
};

// we already have a req.user after authentication middleware, so we just take it and send it in response
const getCurrentUser = async (req, res) => {
  const { _id: id, theme, name, email, birthday, skype, avatarURL } = req.user;

  res.status(200).json({
    user: { id, theme, name, email, birthday, skype, avatarURL },
  });
};

module.exports = {
  signup: ctrlWrapper(signup),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  getCurrentUser: ctrlWrapper(getCurrentUser),
};
