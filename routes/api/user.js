const express = require('express');
const bcryt = require("bcrypt");
const jwt = require('jsonwebtoken');

const User = require('../../models/user');

const { userRegisterSchema } = require('../../helpers/validation/isValidJoi');

const { userLoginSchema } = require('../../helpers/validation/isValidJoi');

const { HttpError } = require('../../helpers');

const { SECRET_KEY } = process.env;

const router = express.Router();

router.post("/register", async (req, res, next) => {
    try {
        const { error } = userRegisterSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Bad Request");
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            throw HttpError(409, "Email already in use");
        };
        
        const createHashPassword = await bcryt.hash(password, 10);
        const newUser = await User.create({ ...req.body, password: createHashPassword });
        res.status(201).json({
            email: newUser.email,
            subscription: newUser.subscription,
        })
    }
    catch {
       next(error); 
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const { error } = userLoginSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Bad Request");
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            throw HttpError(401, "Email or password invalid");
        };

        const passwordCompare = await bcryt.compare(password, user.password);
        if (!passwordCompare) {
            throw HttpError(401, "Email or password invalid");
        };

        const payload = {
            id: user._id,
        };

        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

        res.status(200).json({
            token,
        });
    }
    catch {
        next(error);
    }
});

module.exports = router;