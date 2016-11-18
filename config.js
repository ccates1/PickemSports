module.exports = {
  // App Settings
  MONGO_URI: process.env.MONGO_URI || 'localhost',
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'YOUR_UNIQUE_JWT_TOKEN_SECRET',

  // OAuth 2.0
  FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || '8379758f283820937afcfddab03ef4f5',

  // OAuth 1.0
  TWITTER_KEY: process.env.TWITTER_KEY || 'OUR0vhuLzBeXfgTtNoqJdGezJ',
  TWITTER_SECRET: process.env.TWITTER_SECRET || 'zHyWLUViEWQQSyKaMnnY2TA5EvepzoCyoLIfP8FopDhMq1g7Xt'
};
