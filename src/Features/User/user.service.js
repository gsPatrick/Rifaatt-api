const { User, Plan } = require('../../Models');
const jwt = require('jsonwebtoken');

class UserService {
    async createUser(data) {
        const user = await User.create(data);
        const userWithPlan = await User.findByPk(user.id, {
            include: [{ model: Plan }]
        });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        return { user: userWithPlan, token };
    }

    async login(email, password) {
        const user = await User.findOne({ 
            where: { email },
            include: [{ model: Plan }]
        });
        if (!user || !(await user.checkPassword(password))) {
            throw new Error('Invalid email or password');
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        return { user, token };
    }

    async listUsers() {
        const { Plan, WhatsAppInstance, GroupActivation } = require('../../Models');
        return await User.findAll({ 
            include: [
                { model: Plan, attributes: ['name', 'price', 'instanceLimit', 'groupLimit'] },
                { model: Plan, as: 'accessiblePlans', attributes: ['id', 'name'] },
                { 
                    model: WhatsAppInstance, 
                    attributes: ['id', 'name', 'status', 'instanceKey'],
                    include: [
                        { model: GroupActivation, where: { status: 'active' }, required: false }
                    ]
                }
            ]
        });
    }

    async setPlanAccess(userId, planIds) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuário não encontrado');
        
        // sequelize setAssociation method
        await user.setAccessiblePlans(planIds);
        return true;
    }

    async getProfile(userId) {
        const user = await User.findByPk(userId, {
            include: [
                { model: Plan },
                { model: Plan, as: 'accessiblePlans', attributes: ['id', 'name'] }
            ]
        });
        return user;
    }

    async updateUser(userId, data) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuário não encontrado');
        
        const { planAccess, trialDays, ...otherData } = data;
        
        // Handle Trial Days logic
        if (trialDays && !isNaN(trialDays)) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(trialDays));
            otherData.planExpiresAt = expiresAt;
            otherData.onboardingType = 'TRIAL_ACTIVATED';
        } else if (data.planId && data.planId !== user.planId) {
            otherData.onboardingType = 'PAYMENT_REQUIRED';
        }
        
        await user.update(otherData);
        
        if (planAccess) {
            await user.setAccessiblePlans(planAccess);
        }
        
        return user;
    }

    async deleteUser(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuário não encontrado');
        
        return await user.destroy();
    }

    async updateUserStatus(userId, status) {
        return await User.update({ status }, { where: { id: userId } });
    }

    async updateUserPlan(userId, planId) {
        return await User.update({ planId }, { where: { id: userId } });
    }

    async clearOnboarding(userId) {
        return await User.update({ onboardingType: null }, { where: { id: userId } });
    }
}

module.exports = new UserService();
