const userService = require('../services/userService');

class UserController {
  async register(req, res) {
    try {
      const { name, email, phone, password, role } = req.body;

      const user = await userService.createUser({
        name,
        email,
        phone,
        password,
        role,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const { token, user } = await userService.authenticateUser(email, password);

      res.status(200).json({
        message: 'Login successful',
        token,
        user,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await userService.getUserById(req.user.user_id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const users = await userService.getUsersByRole(role);
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await userService.updateUser(req.user.user_id, req.body);
      res.status(200).json({ message: 'Profile updated', user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
