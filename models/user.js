const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const EMAIL_REGEX = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
const THEME_VALUES = ["light", "dark"];

const userSchema = new Schema(
  {
    theme: {
      type: String,
      enum: THEME_VALUES,
      default: THEME_VALUES[0],
    },
    name: {
      type: String,
      maxLength: 40,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      match: EMAIL_REGEX,
      unique: true, // prevents from adding a duplicate email to the database
      required: [true, "Email is required"],
    },
    phone: {
      type: String,
      maxLength: 20,
      default: null,
    },
    password: {
      type: String,
      minLength: 6,
      required: [true, "Password is required"],
    },
    // timestamp
    birthday: {
      type: Number,
      default: null,
    },
    skype: {
      type: String,
      default: null,
    },
    token: {
      type: String,
      // we don't have a token, until the user logs in
      default: null,
    },
    avatarURL: {
      type: String,
      default: null,
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

const signupSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().pattern(EMAIL_REGEX).required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required(),
  password: Joi.string().min(6).required(),
});

const emailSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    "string.empty": `"email" cannot be an empty field`,
    "any.required": `missing required field: "email"`,
  }),
});

const nameSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": `"name" cannot be an empty field`,
    "any.required": `missing required field: "name"`,
  }),
});

const phoneSchema = Joi.object({
  phone: Joi.string().required().messages({
    "string.empty": `"phone" cannot be an empty field`,
    "any.required": `missing required field: "phone"`,
  }),
});

const skypeSchema = Joi.object({
  skype: Joi.string().required().messages({
    "string.empty": `"skype" cannot be an empty field`,
    "any.required": `missing required field: "skype"`,
  }),
});

const birthdaySchema = Joi.object({
  birthday: Joi.string().required().messages({
    "string.empty": `"birthday" cannot be an empty field`,
    "any.required": `missing required field: "birthday"`,
  }),
});

const themeSchema = Joi.object({
  theme: Joi.string()
    .valid(...THEME_VALUES)
    .required(),
});

const schemas = {
  signupSchema,
  emailSchema,
  loginSchema,
  nameSchema,
  phoneSchema,
  skypeSchema,
  birthdaySchema,
  themeSchema,
};

// model() method creates a model of the Schema. It is a Class, so we use capital letter. 1st argument - name of the collection of DB in a ❗single form, 2nd - schema
const User = model("user", userSchema);

module.exports = {
  User,
  userSchema,
  schemas,
};
