const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const { HttpError } = require("../helpers");
const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
  // Checking authorization property in headers. All headers in Node.js we type in lowercase.
  // We use authorization = "" in case if no authorization header is sent, it'll be undefined, and we can't split "undefined"
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer") {
    next(HttpError(401)); // next() stops function execution
  }

  try {
    // checks token expiration, and whether this token was encrypted using this SECRET_KEY. Throws and error, if token is expired. that's why we should use try catch. If token is valid, it returns our payload - in our case "id" of the user.

    const { id } = jwt.verify(token, SECRET_KEY);
    // If the token is valid and not expired, the user could still have been deleted from the DB. That's why we check if the user with this id exists in DB.
    const user = await User.findById(id);

    // throws 401 Unauthorized if there's no user in DB or there's no token in user's document in DB or sent token is not the same token, saved in DB
    if (!user || !user.token || user.token !== token) {
      next(HttpError(401));
    }
    // we add a user object to request to be able to identify him during http requests later
    req.user = user;
    next();
  } catch {
    next(HttpError(401));
  }
};

module.exports = authenticate;
