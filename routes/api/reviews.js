const express = require('express');
const {isValidId, authenticate, validateBody} = require("../../middlewares")
const ctrl = require("../../controllers/reviews");
const { addSchema } = require('../../models/review');
const router = express.Router();


// ---------------- get all ---------------------------------
router.get("/", ctrl.getAll);

// ----------------- get User Review --------------------------

router.get("/:userId", authenticate, ctrl.getAuthReview);

//  ---------------- post review ----------------------------

router.post('/', authenticate, validateBody(addSchema), ctrl.addReview)

// //  ------------------ update -------------------------------------------

router.patch('/:reviewId', authenticate, isValidId, validateBody(addSchema), ctrl.updateReview);

// //  ----------------- delete ----------------------------------------------

router.delete('/:reviewId', authenticate, isValidId, ctrl.deleteReview)


module.exports = router;