import rateLimit from 'express-rate-limit';

/** General rate limit for the `/auth` router. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter limit for the two endpoints that check a password. The general
 * authLimiter above allows 100 requests per window, which is 100 password
 * guesses against /login and /verify-admin — too generous for a brute-force
 * guard. Must be applied before authLimiter so the tighter budget wins on
 * these paths.
 */
export const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many password attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
