const userService = require('./user.service');

class UserController {
    async register(req, res) {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const data = await userService.login(email, password);
            res.json(data);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }

    async list(req, res) {
        try {
            const users = await userService.listUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new UserController();
