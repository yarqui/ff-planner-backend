const { Contact } = require("../models/contact");
const { HttpError, ctrlWrapper } = require("../helpers");

const listContacts = async (req, res) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 10, favorite } = req.query;
  const skip = (page - 1) * limit;

  const queryFilter = favorite ? { owner, favorite } : { owner };
  console.log("queryFilter:", queryFilter);

  // we can pass the 2nd argument to find() to include fields ("password" or {password:1}) or exclude fields ("-password" or {password: 0})
  const result = await Contact.find(queryFilter, "-createdAt -updatedAt", {
    limit,
    skip,
  }).populate("owner", "name email");
  // populate() tells mongoose to get this "owner" field, find the collection it belongs to (using "ref" in Contact model), find the object with this ID and paste the whole object instead of this "owner" field

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(result);
};

const getContactById = async (req, res) => {
  const { contactId } = req.params;
  const { _id: owner } = req.user;

  const result = await Contact.findById(contactId);

  // compares owner of token and owner of contact
  if (result.owner.toString() !== owner.toString()) {
    throw HttpError(401);
  }

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(result);
};

const addContact = async (req, res) => {
  const { _id: owner } = req.user; // we rename an "_id" to "owner" to match the User Schema
  const { email } = req.body;

  // we use findOne, because if we have no result matching query, it will return null
  const isItDuplicate = await Contact.findOne({ email, owner });
  if (isItDuplicate) {
    throw HttpError(409);
  }

  const newContact = await Contact.create({ ...req.body, owner });
  if (!newContact) {
    throw HttpError(422);
  }

  res.status(201).json(newContact);
};

const removeContact = async (req, res) => {
  const { contactId } = req.params;
  const { _id: owner } = req.user;

  // compares owner of token and owner of contact
  const contactFromDB = await Contact.findById(contactId);
  if (contactFromDB.owner.toString() !== owner.toString()) {
    throw HttpError(401);
  }

  const result = await Contact.findByIdAndRemove(contactId);

  if (!result) {
    throw HttpError(404);
  }
  // if we set res.status(204), the body of the message won't be sent in res.json()
  res.json("contact deleted");
};

const updateContact = async (req, res) => {
  const { contactId } = req.params;
  const { _id: owner } = req.user;

  if (!req.body) {
    throw HttpError(400);
  }

  // compares owner of token and owner of contact
  const contactFromDB = await Contact.findById(contactId);
  if (contactFromDB.owner.toString() !== owner.toString()) {
    throw HttpError(401);
  }

  const result = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
    select: "-createdAt",
  });

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(result);
};

const updateStatusContact = async (req, res) => {
  const { contactId } = req.params;
  const { _id: owner } = req.user;

  if (!req.body) {
    throw HttpError(400, "Missing field: favorite");
  }

  // compares owner of token and owner of contact
  const contactFromDB = await Contact.findById(contactId);
  if (contactFromDB.owner.toString() !== owner.toString()) {
    throw HttpError(401);
  }

  const result = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
    select: "-createdAt -updatedAt",
  });

  if (!result) {
    throw HttpError(404);
  }

  res.status(200).json(result);
};

module.exports = {
  listContacts: ctrlWrapper(listContacts),
  getContactById: ctrlWrapper(getContactById),
  addContact: ctrlWrapper(addContact),
  removeContact: ctrlWrapper(removeContact),
  updateContact: ctrlWrapper(updateContact),
  updateStatusContact: ctrlWrapper(updateStatusContact),
};
