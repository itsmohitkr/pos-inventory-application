const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', authController.login);
router.get('/profile', authController.getProfile);
router.get('/users', authController.getAllUsers);
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);
router.put('/users/:id/change-password', authController.changePassword);
router.post('/wipe-database', authController.wipeDatabase);

module.exports = router;
