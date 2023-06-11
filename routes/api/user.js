const express = require('express');
const bcryt = require("bcrypt");
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const gravatar = require('gravatar');
const jimp = require("jimp");
const { nanoid } = require("nanoid");

const User = require('../../models/user');

const { userRegisterSchema } = require('../../helpers/validation/isValidJoi');

const { userLoginSchema } = require('../../helpers/validation/isValidJoi');

const { userEmailSchema } = require('../../helpers/validation/isValidJoi');

const { HttpError, sendEmail } = require('../../helpers');

const { authenticate } = require('../../middlewares');

const { upload } = require('../../middlewares');

const { SECRET_KEY, PROJECT_URL } = process.env;

const router = express.Router();

const avatarsDir = path.join(__dirname, "../", "../", "public", "avatars");

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
        const avatarUrl = gravatar.url(email);
        const verificationToken = nanoid();

        const newUser = await User.create({ ...req.body, password: createHashPassword, avatarUrl, verificationToken });

        const verifyEmail = {
            to: email,
            subject: "Verify email",
            html: `<a target="_blank" href="${PROJECT_URL}/api/user/verify/${verificationToken}">Click to verify email</a>`
        };
        await sendEmail(verifyEmail);

        res.status(201).json({
            email: newUser.email,
            subscription: newUser.subscription,
        })
    }
    catch (error) {
       next(error); 
    }
});

router.get("/verify/:verificationToken", async (req, res, next) => {
    try {
        const { verificationToken } = req.params;
        const user = await User.findOne({ verificationToken });
        if (!user) {
            throw HttpError(404, "Not found");
        };
        await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });

        res.status(200).json({
            message: 'Verification successful',
        });
    }
    catch (error) {
        next(error);
    }
});

router.post("/verify", async (req, res, next) => {
    try {
        const { error } = userEmailSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Missing required field email");
        }

        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            throw HttpError(404, "Email not found");
        };
        if (user.verify) {
            throw HttpError(400, "Verification has already been passed");
        };

        const verifyEmail = {
            to: email,
            subject: "Verify email",
            html: `<a target="_blank" href="${PROJECT_URL}/api/user/verify/${user.verificationToken}">Click to verify email</a>`
        };
        await sendEmail(verifyEmail);

        res.status(200).json({
            message: 'Verification email send',
        });
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
        if (!user || !user.verify) {
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

router.patch("/avatars", authenticate, upload.single("avatar"), async (req, res, next) => {
    try {
        const { _id } = req.user;
        const { path: tmpUploud, originalname } = req.file;
        const fileName = `${_id}_${originalname}`;
        const resultUpload = path.join(avatarsDir, fileName);
        await fs.rename(tmpUploud, resultUpload);

        const avatar = await jimp.read(resultUpload);
        await avatar.resize(250, 250);
        await avatar.writeAsync(resultUpload);

        const avatarUrl = path.join("avatars", fileName);
        await User.findByIdAndUpdate(_id, { avatarUrl });

        res.status(201).json({
            avatarUrl,
        });
    }
    catch (error) {
        next(error);
    }
});

module.exports = router;