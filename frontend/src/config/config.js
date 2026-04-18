const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api',
    TIMEOUT: 30000,
  },
  production: {
    API_BASE_URL: 'https://api.logistics.com/api',
    TIMEOUT: 30000,
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env];
