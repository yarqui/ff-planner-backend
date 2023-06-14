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
    filter.ownerId = new mongoose.Types.ObjectId(ownerId);
  }

  if (filterBy === "best") {
    filter.rating = { $gte: 4 };
  }

  const filteredReviews = await Review.find(filter, "-createdAt -updatedAt", {
    skip,
    limit,
  });

  const usersFromReviews = await Promise.all(
    Array.from(new Set(filteredReviews.map(({ ownerId }) => ownerId))).map(
      (id) => User.findById(id, "_id name email avatarURL ")
    )
  );

  const updatedReviews = filteredReviews.map(
    ({ ownerId, _id, comment, rating }) => ({
      _id,
      comment,
      rating,
      owner: Array.from(usersFromReviews).find(
        ({ _id }) => _id.toString() === ownerId
      ),
    })
  );

  res.status(200).json(updatedReviews);
};

// ------------------ Add Review --------------------------
const addReview = async (req, res) => {
  const { _id: ownerId } = req.user;
  const { comment, rating } = req.body;

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
