const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return next();
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next();
        }

        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        return next();
    });
};
