const { ctrlWrapper, HttpError } = require('../helpers');
const { Review } = require('../models/review');

// ----------------------- Get All --------------------------
const getAll = async (req, res) => {
  
    const {page = 1, limit = 15} = req.query;
    const skip = (page - 1) * limit;

    const result = await Review.find({}, "-createdAt -updatedAt", { skip, limit });
     if(!result) {
      throw HttpError(404);
    }  
    res.status(200).json(result)
}

// ---------------------- Get User Review ---------------------
// const getAuthReview = async (req, res) => {    

//   const {page = 1, limit = 15 } = req.query;
//   const skip = (page - 1) * limit;
//   const { _id } = req.user;

//   const result = await Review.find({"owner._id": _id}, "-createdAt -updatedAt" , { skip, limit });

//   res.status(200).json(result);
// }

// ------------------ Add Review --------------------------
const addReview = async (req, res) => {
  const { _id, name, email, avatarURL } = req.user;
  const owner = {
  name,
  avatarURL,
  email,
  _id,
    };
    
  const result = await Review.create({ ...req.body, owner });
  if(!result) {
      throw HttpError(404);
  }
  
  res.status(201).json(result);
  } 

// ----------------- update Review ---------------------------------
const updateReview = async (req, res) => {
  const { reviewId: _id } = req.params;
  
  const currentUserId  = req.user._id;
  const review = await Review.findById(_id); 
      if (!review) {
    throw HttpError(404);
  }
  const idByOwnerReview = review.owner._id.toString()
 
  if (idByOwnerReview !== currentUserId.toString()) {
    throw HttpError(401);
  }
   
  const result = await Review.findOneAndUpdate({_id}, {...req.body}, {new: true});
  if(!result) {
      throw HttpError(404);
    }
  
  res.status(200).json(result);
  } 

//  ---------------- delete Review -----------------------------
const deleteReview = async (req, res) => {
  const { reviewId: _id } = req.params;

  const currentUserId  = req.user._id;
  const review = await Review.findById(_id); 

    if (!review) {
    throw HttpError(404);
  }

  const idByOwnerReview = review.owner._id.toString()

  if (idByOwnerReview !== currentUserId.toString()) {
    throw HttpError(401);
  }
  
  const result = await Review.findOneAndDelete({ _id })
  if (!result) {
      throw HttpError(404);
    }
    res.json({
      message: "Delete success"
    })
  } 

module.exports = {
    getAll: ctrlWrapper(getAll),
    // getAuthReview: ctrlWrapper(getAuthReview),
    addReview: ctrlWrapper(addReview),
    updateReview: ctrlWrapper(updateReview),
    deleteReview: ctrlWrapper(deleteReview),
}