const { Schema, model } = require("mongoose");
const joi = require("joi");
const { handleMongooseError } = require("../helpers");
// const { userSchema } = require("./user");

const reviewSchema = new Schema(
  {
    comment: {
      type: String,
      maxLength: 800,
      required: [true, "Comment is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
    },
    ownerId: {
      type: String,
      required: [true, "Comment's owner is required"],
    },
  },
  {
    // removes "_v" and adds creation and changing timestamps to document
    versionKey: false,
    timestamps: true,
  }
);

// if during saving we have an error, this middleware is set, otherwise mongoose error doesn't set error.status
reviewSchema.post("save", handleMongooseError);

// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a ❗single form, 2nd - schema
const Review = model("review", reviewSchema);

const addSchema = joi
  .object({
    comment: joi.string().min(3).max(800).required(),
    ownerId: joi.string(), // FIXME: do we need it?
    rating: joi.number().min(1).max(5).required(),
  })
  .unknown(true);

module.exports = {
  Review,
  addSchema,
};
