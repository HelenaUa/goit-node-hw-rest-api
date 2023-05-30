const express = require('express');
const bcryt = require("bcrypt");
const jwt = require('jsonwebtoken');

const User = require('../../models/user');

const { userRegisterSchema } = require('../../helpers/validation/isValidJoi');

const { userLoginSchema } = require('../../helpers/validation/isValidJoi');

const { HttpError } = require('../../helpers');

const { authenticate } = require('../../middlewares');

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
    catch (error) {
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
        await User.findByIdAndUpdate(user._id, { token });

        res.status(200).json({
            token,
        });
    }
    catch (error) {
        next(error);
    }
});

router.get("/current", authenticate, async (req, res, next) => {
    try {
        const { email, subscription } = req.user;
        res.json({
            email,
            subscription,
        })
    }
    catch (error) {
        next(error);
    }
});

router.post("/logout", authenticate, async (req, res, next) => {
    try {
        const { _id } = req.user;
        await User.findByIdAndUpdate(_id, { token: "" });
        res.json({
            message: "Logout success",
        })
    }
    catch (error) {
        next(error);
    }
});

module.exports = router;