const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");
const { userSchema } = require("./user");

const reviewSchema = new Schema(
  {
    comments: {
      type: String,
      masLength: 800,
      required: [true, "Comment is required"],
    },
    owner: {
      // TODO: we will try to set the userSchema from user.js to match the exact object
      // will it work?
      // type: userSchema,
      type: Object,
      required: [true, "Comment's owner is required"],
      rating: {
        type: Number,
        required: [true, "Rating is required"],
      },
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
const Review = model("review", taskSchema);

module.exports = {
  Review,
};
