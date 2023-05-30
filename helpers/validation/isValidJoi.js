const Joi = require('joi');

const contactAddSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
});

const contactFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required()
});

const userRegisterSchema = Joi.object({
  email: Joi.string().pattern(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/).required(),
  password: Joi.string().min(6).required(),
  subscription: Joi.string().required(),
});

const userLoginSchema = Joi.object({
  email: Joi.string().pattern(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/).required(),
  password: Joi.string().min(6).required(),
});

module.exports = {
    contactAddSchema,
    contactFavoriteSchema,
    userRegisterSchema,
    userLoginSchema,
};