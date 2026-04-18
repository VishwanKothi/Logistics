module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret_change_this',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
};
