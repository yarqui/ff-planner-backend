const { isValidObjectId } = require("mongoose");
const HttpError = require("../helpers/HttpError");

const isValidId = (req, res, next) => {
  const { reviewId, userId } = req.params;
  if (!isValidObjectId(reviewId || userId)) {
    next(HttpError(400, `${reviewId || userId} is not a valid id`));
  }
  next();
};

module.exports = isValidId;
