const Joi = require('joi');

const activitySchema = Joi.object({
  userId: Joi.string().trim().min(1).required().messages({
    'string.empty': '\"userId\" must not be empty',
    'any.required': '\"userId\" is required',
  }),
  eventType: Joi.string().trim().min(1).required().messages({
    'string.empty': '\"eventType\" must not be empty',
    'any.required': '\"eventType\" is required',
  }),
  timestamp: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.isoDate': '\"timestamp\" must be a valid ISO-8601 date string',
      'any.required': '\"timestamp\" is required',
    }),
  payload: Joi.object().required().messages({
    'object.base': '\"payload\" must be a JSON object',
    'any.required': '\"payload\" is required',
  }),
});

function validateActivity(data) {
  return activitySchema.validate(data, { abortEarly: false });
}

module.exports = { validateActivity, activitySchema };
