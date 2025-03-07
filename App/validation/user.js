const joi = require("joi")


    const signupschemavalidation = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        phone: joi.string().required(),
        password: joi.string().min(8 ).pattern(/^[a-zA-Z0-9]{3,30}$/,"Password should be alphanumeric and minimum length should be 8 characters long").required(),
        role: joi.string().required()
    })
    
    const loginschemavalidation = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8 ).pattern(/^[a-zA-Z0-9]{3,30}$/,"Password should be alphanumeric and minimum length should be 8 characters long").required()
    })

    module.exports = {signupschemavalidation,loginschemavalidation}