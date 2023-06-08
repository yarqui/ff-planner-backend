const { isValidObjectId } = require("mongoose");
const HttpError = require("../helpers/HttpError");


const isValidId = (paramName) => (req, _, next) => {
  const id = req.params[paramName];

  if (!isValidObjectId(id)) {
    next(HttpError(400, `${id} is not a valid ${paramName}`));
  }
  next();
};

module.exports = isValidId;
