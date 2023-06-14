const { ctrlWrapper, HttpError } = require("../helpers");
const mongoose = require("mongoose");
const { Review } = require("../models/review");
const { User } = require("../models/user");

// ----------------------- Get All --------------------------
const getAll = async (req, res) => {
  const { page = 1, limit = 20, filterBy, ownerId } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};

  if (filterBy === "owner" && ownerId) {
    filter["ownerId"] = new mongoose.Types.ObjectId(ownerId);
  }

  if (filterBy === "best") {
    filter.rating = { $gte: 4 };
  }

  console.log("filter:", filter);

  const result = await Review.find(filter, "-createdAt -updatedAt", {
    skip,
    limit,
  });

  const userIdFromResult = result[0].ownerId;
  console.log("userIdFromResult:", userIdFromResult);

  if (!result) {
    throw HttpError(404);
  }

  const { name, avatarURL } = await User.findById(ownerId || userIdFromResult);

  res.status(200).json({ result, userDTO: { name, avatarURL } });
};

// ------------------ Add Review --------------------------
const addReview = async (req, res) => {
  const { _id: ownerId, name, email, avatarURL } = req.user;
  // const { _id, name, email, avatarURL } = req.user;
  const { comment, rating } = req.body;
  // const owner = {
  //   name,
  //   avatarURL,
  //   email,
  //   _id,
  // };

  const result = await Review.create({ comment, rating, ownerId });
  if (!result) {
    throw HttpError(400);
  }

  res.status(201).json(result);
};

// ----------------- update Review ---------------------------------
const updateReview = async (req, res) => {
  const { reviewId: _id } = req.params;
  const { comment, rating } = req.body;

  const currentUserId = req.user._id;
  const review = await Review.findById(_id);
  if (!review) {
    throw HttpError(404);
  }
  const idByOwnerReview = review.owner._id.toString();

  if (idByOwnerReview !== currentUserId.toString()) {
    throw HttpError(401);
  }

  const result = await Review.findOneAndUpdate(
    { _id },
    { comment, rating },
    { new: true }
  );
  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(result);
};

//  ---------------- delete Review -----------------------------
const deleteReview = async (req, res) => {
  const { reviewId: _id } = req.params;

  const currentUserId = req.user._id;
  const review = await Review.findById(_id);

  if (!review) {
    throw HttpError(404);
  }

  const idByOwnerReview = review.owner._id.toString();

  if (idByOwnerReview !== currentUserId.toString()) {
    throw HttpError(401);
  }

  const result = await Review.findOneAndDelete({ _id });
  if (!result) {
    throw HttpError(404);
  }
  res.json({
    message: "Delete success",
  });
};

module.exports = {
  getAll: ctrlWrapper(getAll),
  addReview: ctrlWrapper(addReview),
  updateReview: ctrlWrapper(updateReview),
  deleteReview: ctrlWrapper(deleteReview),
};
