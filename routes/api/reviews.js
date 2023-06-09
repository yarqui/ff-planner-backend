
const express = require('express');
const {isValidId, authenticate, validateBody} = require("../../middlewares")
const ctrl = require("../../controllers/reviews");
const { addSchema } = require('../../models/review');

const router = express.Router();

// ---------------- get all ---------------------------------
router.get("/", ctrl.getAll);

// ----------------- get User Review --------------------------

// router.get("/my-reviews", authenticate, ctrl.getAuthReview);

//  ---------------- post review ----------------------------

router.post('/', authenticate, validateBody(addSchema), ctrl.addReview)

// //  ------------------ update -------------------------------------------

router.patch('/:reviewId', authenticate, isValidId("reviewId"), validateBody(addSchema), ctrl.updateReview);

// //  ----------------- delete ----------------------------------------------

router.delete('/:reviewId', authenticate, isValidId("reviewId"), ctrl.deleteReview)

module.exports = router;
