const User = require('../../Models/User');
const jwt = require('jsonwebtoken');

class UserService {
    async createUser(data) {
        return await User.create(data);
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.checkPassword(password))) {
            throw new Error('Invalid email or password');
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        return { user, token };
    }

    async listUsers() {
        return await User.findAll({ attributes: { exclude: ['password'] } });
    }
}

module.exports = new UserService();
