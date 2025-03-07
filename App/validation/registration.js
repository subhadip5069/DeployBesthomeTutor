const joi = require("joi")

const registrationvalidation = joi.object({
    TutionLocation: joi.string().required(),
    ScheduleTime: joi.string().valid('Morning', 'Afternoon', 'Evening', 'Night').required (),
    gender: joi.string().valid('Male', 'Female', 'Other').required(),
    cost: joi.string().required(),
    feetype: joi.string().valid('Monthly', 'Hourly','yearly').required(),
    subject: joi.string().required(),
    class: joi.string().required(),
    sorted: joi.string().valid('Yes', 'No').required()
})

module.exports = registrationvalidation