const { Schema, model } = require('mongoose');

const { handleMongooseError } = require("../helpers");

const emailRegexp = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

const userSchema = new Schema({
        password: {
            type: String,
            minlength: 6,
            required: [true, 'Password is required'],  
        },
        email: {
            type: String,
            match: emailRegexp,
            required: [true, 'Email is required'],
            unique: true,
        },
        subscription: {
            type: String,
            enum: ["starter", "pro", "business"],
            default: "starter",
        },
        avatarUrl: {
            type: String,
            required: true,
        },
        token: {
            type: String,
            default: null,
        },
        verify: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            required: [true, 'Verify token is required'],
        },
}, { versionKey: false, timestamps: true });

userSchema.post("save", handleMongooseError);

const User = model("user", userSchema);

module.exports = User;




