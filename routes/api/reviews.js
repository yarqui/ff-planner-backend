const express = require("express");
const { isValidId, authenticate } = require("../../middlewares");
const ctrl = require("../../controllers/reviews");
const router = express.Router();

// ---------------- get all ---------------------------------
router.get("/", ctrl.getAll);

// ----------------- get User Review --------------------------

router.get("/auth", authenticate, ctrl.getAuthReview);

//  ---------------- post review ----------------------------

router.post("/", authenticate, ctrl.addReview);

// //  ------------------ update -------------------------------------------

router.put("/:reviewId", authenticate, isValidId, ctrl.updateReview);

// //  ----------------- delete ----------------------------------------------

router.delete("/:reviewId", authenticate, isValidId, ctrl.deleteReview);

module.exports = router;
