module.exports = {
  datasource: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./pos.db',
  },
};
