import { createAuthHandler } from '../server/auth-handler.mjs';
import { createRedis } from '../server/redis.mjs';
import { createVerification } from '../server/verification.mjs';
import { createAccounts, createEmailSender } from '../server/providers.mjs';

export default createAuthHandler({
  env: process.env,
  getVerification: () => createVerification({
    command: createRedis(process.env),
    secret: process.env.AUTH_VERIFICATION_SECRET,
    namespace: process.env.AUTH_REDIS_NAMESPACE,
    sendEmail: createEmailSender(process.env),
    dailyLimit: Math.max(1, Math.min(1000, Number(process.env.AUTH_EMAIL_DAILY_LIMIT) || 100)),
  }),
  getAccounts: () => createAccounts(process.env),
});
