const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const { nanoid } = require("nanoid");
const { User } = require("../models/user");
const { HttpError, ctrlWrapper, sendSgEmail } = require("../helpers");
const {
  uploadAvatar,
  deleteAvatar,
} = require("../cloudinary/cloudinaryOperations");

const { SECRET_KEY, FRONTEND_URL } = process.env;

const signup = async (req, res) => {
  // First, we check if req.body is not empty, then we check if email is already in use. If it is, we throw custom error message about email in use.
  if (JSON.stringify(req.body) === "{}") {
    throw HttpError(400, "No data to update with");
  }
  const { name, email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (user) {
    throw HttpError(409, "Email is already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // create verificationCode for verifying an email after sign up
  const verificationToken = await nanoid();
  // If email is unique, we make a request to create a new user;
  const newUser = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    verificationToken,
  });

  if (!newUser) {
    throw HttpError(422, "Unprocessable Content");
  }

  const verificationEmail = {
    to: normalizedEmail,
    subject: "Please verify your email",
    html: `<p>Click <a target="_blank" href="${FRONTEND_URL}/login/?verificationToken=${verificationToken}">here</a> to verify your email: <strong>${normalizedEmail}</strong></p>`,
  };

  // sends verification email
  await sendSgEmail(verificationEmail);

  res.status(201).json({
    user: {
      name,
      email: normalizedEmail,
    },
  });
};

const login = async (req, res) => {
  if (JSON.stringify(req.body) === "{}") {
    throw HttpError(400, "No data to update with");
  }
  const { email, password } = req.body;

  const user = await User.findOne({ email });
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
  const result = await User.findByIdAndUpdate(user._id, { token });
  if (!result) {
    throw HttpError(400);
  }

  try {
    // checks token expiration, and whether this token was encrypted using this SECRET_KEY. Throws an error, if token is expired. that's why we should use try catch. If token is valid, it returns our payload - in our case "id" of the user.
    const { id } = jwt.verify(token, SECRET_KEY); // eslint-disable-line
  } catch (error) {
    console.log(error.message);
  }

  const { _id: id, theme, name, phone, birthday, skype, avatarURL } = user;

  res.status(200).json({
    token,
    user: { id, theme, name, email, phone, birthday, skype, avatarURL },
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

  res.redirect(`${FRONTEND_URL}/login`);
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw HttpError(400, "Missing required field email");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ normalizedEmail });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verificationEmail = {
    to: normalizedEmail,
    subject: "Please verify your email",
    html: `<p>Click <a target="_blank" href="${FRONTEND_URL}/login/?verificationToken=${user.verificationToken}">here</a> to verify your email: <strong>${normalizedEmail}</strong></p>`,
  };

  // sends verification email
  await sendSgEmail(verificationEmail);

  res.status(200).json({ message: "Verification email sent" });
};

const getCurrentUser = async (req, res) => {
  const {
    _id: idFromToken,
    theme,
    name,
    email,
    birthday,
    skype,
    avatarURL,
  } = req.user;
  const { userId: id } = req.params;

  if (idFromToken.toString() !== id) {
    throw HttpError(401, "You are not authorized to perform this action");
  }

  res.status(200).json({
    user: { id, theme, name, email, birthday, skype, avatarURL },
  });
};

const updateUserProfile = async (req, res) => {
  const { _id } = req.user;
  const { userId } = req.params;

  // checks if _id from authentication is the same userId in params
  if (_id.toString() !== userId) {
    throw HttpError(401, "You are not authorized to perform this action");
  }

  if (JSON.stringify(req.body) === "{}") {
    throw HttpError(400, "No data to update with");
  }

  const { theme, name, email, phone, birthday, skype } = req.body;
  // sanitizes email and writes it to req.body
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    req.body.email = normalizedEmail;
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    { theme, name, email, phone, birthday, skype },
    {
      new: true,
      select: "id theme name email phone birthday skype avatarURL",
    }
  );

  if (!updatedUser) {
    throw HttpError(404, "User not found");
  }

  res.status(200).json({ user: updatedUser });
};

const changeUserPassword = async (req, res) => {
  const { _id } = req.user;
  const { userId } = req.params;

  // checks if _id from authentication is the same userId in params
  if (_id.toString() !== userId) {
    throw HttpError(401, "You are not authorized to perform this action");
  }

  if (JSON.stringify(req.body) === "{}") {
    throw HttpError(400, "No data to update with");
  }
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(_id);
  if (!user) {
    throw HttpError(401);
  }
  // compares if password in DB is the same as password in request. If it is, it returns true.
  const passwordCompare = await bcrypt.compare(oldPassword, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Old password is wrong");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      password: hashedPassword,
    },
    {
      new: true,
      select: "id theme name email phone birthday skype avatarURL",
    }
  );

  if (!updatedUser) {
    throw HttpError(401, "Email or password is wrong");
  }

  res.status(200).json({ user: updatedUser });
};

const updateUserAvatar = async (req, res) => {
  const { _id, avatarPublicId: avatarIdFromDB = null } = req.user;

  if (!req.file) {
    throw HttpError(400, "Missing the file to upload");
  }
  // Path has a URL WITH FILE & extension, where the uploaded file came from (device)
  const { path } = req.file;

  // If there is a previous avatar public_id in DB, it deletes it, before uploading a new one
  if (avatarIdFromDB) {
    await deleteAvatar(avatarIdFromDB);
  }

  const { secure_url: avatarURL, public_id: avatarPublicId } =
    await uploadAvatar(path);

  // Deletes the file from device after uploading, using the fs.unlink function
  fs.unlink(path, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    }
  });

  const result = await User.findByIdAndUpdate(
    _id,
    { avatarURL, avatarPublicId },
    {
      new: true,
    }
  );

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json({ avatarURL, avatarPublicId });
};

module.exports = {
  signup: ctrlWrapper(signup),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  updateUserProfile: ctrlWrapper(updateUserProfile),
  changeUserPassword: ctrlWrapper(changeUserPassword),
  updateUserAvatar: ctrlWrapper(updateUserAvatar),
};
