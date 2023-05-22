const { Schema, model } = require('mongoose');

const contactSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Set name for contact'], 
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    favorite: {
        type: Boolean,
        default: false,
    },
}, { versionKey: false, timestamps: true });

const hendleMongooseError = (error, data, next) => {
    error.status = 400;
    next();
};

contactSchema.post("save", hendleMongooseError);

const Contact = model("contact", contactSchema);

module.exports = Contact;