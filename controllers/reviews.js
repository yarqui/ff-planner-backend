const { ctrlWrapper, HttpError } = require('../helpers');
const { Review, addSchema } = require('../models/review');

// ----------------------- Get All --------------------------
const getAll = async (req, res, next) => {
      try {
    const {page = 1, limit = 15} = req.query;
    const skip = (page - 1) * limit;

    const result = await Review.find( {}, "-createdAt -updatedAt", {skip, limit})
          .populate("owner", "name email");
      
    res.json(result)
  } 
  catch (error) {
    next(error)
  }
}

// ---------------------- Get User Review ---------------------

const getAuthReview = async (req, res, next) => {
  try {
    
    const {_id: authReview} = req.user;
    const {page = 1, limit = 15 } = req.query;
    const skip = (page - 1) * limit;

    const result = await Review.find({authReview}, "-createdAt -updatedAt", {skip, limit})
    .populate("owner", "name email");
  
    res.json(result)
  } 
  catch (error) {
    next(error)
  }
}
// ------------------ Add Review --------------------------

const addReview = async (req, res, next) => {
  try {
    const {error} = addSchema.validate(req.body);

    if (error) {
      throw HttpError(400, error.message)
    }
    
    const owner = {
       name: req.user.name,
       avatarURL:req.user.avatarURL,
       email: req.user.email,
       _id: req.user.id
    }
    
    const {_id: authReview} = req.user;
    const result = await Review.create({...req.body, owner, authReview});

    res.status(201).json(result);
  } 
  catch (error) {
    next(error)
  }
}

// ----------------- update Review ---------------------------------
const updateReview = async (req, res, next) => {
  try {
    const {error} = addSchema.validate(req.body);

    if (error) {
      throw HttpError(400, error.message)
    }

    const owner = {
       name: req.user.name,
       avatarURL:req.user.avatarURL,
       email: req.user.email,
       _id: req.user.id
    }

    const { reviewId: _id } = req.params;
    const {_id: authReview} = req.user;
    const result = await Review.findOneAndUpdate({_id, authReview}, {...req.body, owner}, {new: true});
    if(!result) {
      throw HttpError(404, "Not found");
    }
  
    res.json(result);
  } 
  catch (error) {
    next(error)
  }
}

//  ---------------- delete Review -----------------------------
const deleteReview = async (req, res, next) => {
  try {
    const { _id: authReview } = req.user;
 
    const {reviewId: _id } = req.params;
    const result = await Review.findOneAndDelete({_id, authReview})
    if(!result) {
      throw HttpError(404, "Not found");
    }
    res.json({
      message: "Delete success"
    })
  } 
  catch (error) {
    next(error)
  }
}

module.exports = {
    getAll: ctrlWrapper(getAll),
    getAuthReview: ctrlWrapper(getAuthReview),
    addReview: ctrlWrapper(addReview),
    updateReview: ctrlWrapper(updateReview),
    deleteReview: ctrlWrapper(deleteReview),
}