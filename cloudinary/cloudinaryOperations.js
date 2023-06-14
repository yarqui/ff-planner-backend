const cloudinary = require("../cloudinary/cloudinaryConfig");
const { HttpError } = require("../helpers");

const uploadAvatar = async (pathToFile) => {
  try {
    return await cloudinary.uploader.upload(pathToFile, {
      transformation: [{ height: 600, gravity: "face", crop: "fill" }],
    });
  } catch ({ status, message }) {
    throw HttpError(status, message);
  }
};

const deleteAvatar = async (avatarPublicId) => {
  try {
    await cloudinary.uploader.destroy(avatarPublicId);
  } catch ({ status, message }) {
    throw HttpError(status, message);
  }
};

module.exports = { uploadAvatar, deleteAvatar };
