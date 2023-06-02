const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const { nanoid } = require("nanoid");
const { User } = require("../models/user");
const { HttpError, ctrlWrapper, editImage, sendEmail } = require("../helpers");

const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const signup = async (req, res) => {
  // First, we check if email is already in use. If it is, we throw custom error message about email in use.
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email is already in use");
  }

  // const salt = await bcrypt.genSalt(10);
  // for hashing to become unhackable, we use salt - it's the set of random symbols. Then we can add it as the 2nd argument to bcrypt.hash(), but nowadays we can just spare it and set the 2nd argument of hash() to 10
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

  const verifyEmail = {
    to: email,
    subject: "Please verify your email",
    html: `<p>Click <a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">here</a> to verify your email: <strong>${email}</strong></p>`,
  };

  // sendgrid version
  await sendEmail.sendSgEmail(verifyEmail);

  // nodemailer version
  // await sendEmail.sendNodemailerEmail(verifyEmail);

  res.status(201).json({
    user: {
      email,
      subscription: "starter",
    },
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.status(200).json({ message: "Verification successful" });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw HttpError(400, "missing required field email");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Please verify your email",
    html: `<p>Click <a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">here</a> to verify your email: <strong>${email}</strong></p>`,
  };

  // sendgrid version
  await sendEmail.sendSgEmail(verifyEmail);

  // nodemailer version
  // await sendEmail.sendNodemailerEmail(verifyEmail);

  res.status(200).json({ message: "Verification email sent" });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
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

  // checks token expiration, and whether this token was encrypted using this SECRET_KEY. Throws and error, if token is expired. that's why we should use try catch. If token is valid, it returns our payload - in our case "id" of the user.
  try {
    const { id } = jwt.verify(token, SECRET_KEY); // eslint-disable-line
  } catch (error) {
    console.log(error.message);
  }

  res.status(200).json({
    token,
    user: { email: user.email, subscription: user.subscription },
  });
};

// we already have a req.user after authentication middleware, so we just take it and send it in response
const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.status(200).json({ email, subscription });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });

  res.status(204).json();
};

const updateUserSubscription = async (req, res) => {
  const { _id } = req.user;

  if (!req.body) {
    throw HttpError(400, "Missing field: subscription");
  }

  const result = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
    select: "-createdAt -updatedAt",
  });

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(result);
};

const updateUserAvatar = async (req, res) => {
  const { _id } = req.user;
  if (!req.file) {
    throw HttpError(400, "Missing the file to upload");
  }
  // path has a URL WITH file extension, where the uploaded file came from (device)
  // ❗❗❗"originalname" is the name of the uploaded file WITH extension
  // in req.file we have the uploaded file. It doesn't go to req.body
  const { path: tempUpload, originalname } = req.file;
  const avatarName = `${_id}-${originalname}`;

  await editImage(tempUpload);

  // destination path + name
  const destinationUpload = path.join(avatarsDir, avatarName);
  const avatarURL = path.join("avatars", avatarName);
  await fs.rename(tempUpload, destinationUpload);

  const result = await User.findByIdAndUpdate(
    _id,
    { avatarURL },
    {
      new: true,
      select: "email avatarURL",
    }
  );

  console.log("result:", result);

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(avatarURL);
};

module.exports = {
  signup: ctrlWrapper(signup),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateUserSubscription: ctrlWrapper(updateUserSubscription),
  updateUserAvatar: ctrlWrapper(updateUserAvatar),
};
