const express = require('express');

const Contact = require('../../models/contact');

const { contactAddSchema } = require('../../helpers/validation/isValidJoi');

const { contactFavoriteSchema } = require('../../helpers/validation/isValidJoi');

const { HttpError } = require('../../helpers');

const router = express.Router();


router.get('/', async (req, res, next) => {
  try {
    const result = await Contact.find();
    res.status(200).json(result);
  }
  catch (error) {
    next(error);
  }
});

router.get('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const result = await Contact.findOne({_id: contactId});
    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }
     res.status(200).json(result);;
  }
  catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error } = contactAddSchema.validate(req.body);
    if (error) {
      throw HttpError(400, "Missing required name field");
    }
    const result = await Contact.create(req.body);
    res.status(201).json(result);
  }
  catch (error) {
    next(error);
  }
});

router.delete('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const result = await Contact.findByIdAndRemove(contactId);
    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }
    res.status(200).json({
      message: "Contact delete"
    })
  }
  catch (error) {
    next(error);
  }
});

router.put('/:contactId', async (req, res, next) => {
  try {
    const { error } = contactAddSchema.validate(req.body);
    if (error) {
      throw HttpError(400, 'Missing fields');
    }
    const { contactId } = req.params;
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }
     res.status(200).json(result);
  }
  catch (error) {
      next(error);
    }
});
  
router.patch('/:contactId/favorite', async (req, res, next) => {
  try {
    const { error } = contactFavoriteSchema.validate(req.body);
    if (error) {
      throw HttpError(400, "Missing field favorite");
    }
    const { contactId } = req.params;
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
    if (!result) {
        throw HttpError(404, "Not Found")
    }
    res.status(200).json(result);
  }
  catch (error) {
      next(error);
    }
});

module.exports = router;
