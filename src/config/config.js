const config = {
  jwt: {
    expiresIn: '15m',
    secret: process.env.NODE_ENV === 'production' 
      ? process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET must be set in production') })()
      : process.env.JWT_SECRET || 'secret',
  },
  cookie: {
    login: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    },
    logout: {
      maxAge: 1,
    },
  },
  port: process.env.PORT || 3000,
};

export default config;
