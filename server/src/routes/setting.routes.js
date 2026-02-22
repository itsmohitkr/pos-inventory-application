const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');

router.get('/', settingController.getAllSettings);
router.post('/', settingController.updateSettings);

module.exports = router;
