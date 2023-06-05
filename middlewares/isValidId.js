const { isValidObjectId } = require("mongoose");
const HttpError = require("../helpers/HttpError");

const isValidId = (req, res, next) => {
  const { reviewId } = req.params;
  if (!isValidObjectId(reviewId)) {
    next(HttpError(400, `${reviewId} is not a valid id`));
  }
  next();
};

module.exports = isValidId;
