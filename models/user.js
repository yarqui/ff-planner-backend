const { Schema, model } = require("mongoose");
// const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

// TODO: discuss a regexp first
// const emailRegex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
const themeValues = ["light", "dark"];

const userSchema = new Schema(
  {
    theme: {
      type: String,
      enum: themeValues,
      // TODO: should we add it to required? If so, we should add it while creating a user
      default: "light",
    },
    name: {
      type: String,
      maxLength: 40,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      // match: emailRegex, // disabled for now TODO: discuss a regexp
      unique: true, // prevents from adding a duplicate email to the database
      required: [true, "Email is required"],
    },
    phone: {
      type: String,
      // minLength: 6, // TODO: discuss details
      required: [true, "Phone is required"],
    },
    password: {
      type: String,
      minLength: 6,
      required: [true, "Password is required"],
    },
    // timestamp
    birthday: {
      type: Number,
      // required: [true, "Birthday is required"], // TODO: is it required? Discuss it
      default: null,
    },
    skype: {
      type: String,
    },
    token: {
      type: String,
      // we don't have a token, until the user logs in
      default: null,
    },
    avatarURL: {
      type: String,
      required: [true, "Avatar is required"],
    },
    verified: {
      // this field is responsible for whether the user has verified his email
      type: Boolean,
      default: false,
    },
    verificationToken: {
      // verification token sent to verify user's email
      type: String,
      required: [true, "Verification token is required"],
    },
  },
  // removes "_v" and adds creation and changing timestamps to document
  { versionKey: false, timestamps: true }
);

// if during saving we have an error, this middleware is set, otherwise mongoose error doesn't set error.status
userSchema.post("save", handleMongooseError);

// const signupSchema = Joi.object({
//   name: Joi.string(),
//   email: Joi.string().pattern(emailRegex).required(),
//   password: Joi.string().min(6).required(),
// });

// const emailSchema = Joi.object({
//   email: Joi.string().pattern(emailRegex).required().messages({
//     "string.empty": `"email" cannot be an empty field`,
//     "any.required": `missing required field: "email"`,
//   }),
// });

// const loginSchema = Joi.object({
//   email: Joi.string().pattern(emailRegex).required(),
//   password: Joi.string().min(6).required(),
// });

// const updateSubscriptionSchema = Joi.object({
//   subscription: Joi.string()
//     .valid(...subscriptionValues)
//     .required(),
// });

// const schemas = {
//   signupSchema,
//   emailSchema,
//   loginSchema,
//   updateSubscriptionSchema,
// };

// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a ❗single form, 2nd - schema
const User = model("user", userSchema);

module.exports = {
  User,
  userSchema,
  // schemas,
};
