const User = require('../../Models/User');
const jwt = require('jsonwebtoken');

class UserService {
    async createUser(data) {
        const user = await User.create(data);
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        return { user, token };
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
        const { WhatsAppInstance, GroupActivation, Plan } = require('../../Models');
        return await User.findAll({ 
            attributes: { exclude: ['password'] },
            include: [
                { model: Plan, attributes: ['name'] }
            ]
        });
    }

    async updateUserStatus(userId, status) {
        return await User.update({ status }, { where: { id: userId } });
    }

    async updateUserPlan(userId, planId) {
        return await User.update({ planId }, { where: { id: userId } });
    }
}

module.exports = new UserService();
