import type { NextAuthConfig } from 'next-auth';
import Feishu from './sso-providers/feishu';

import { authEnv } from '@/config/auth';

if (!authEnv.AUTH_FEISHU_ID || !authEnv.AUTH_FEISHU_SECRET) {
  console.warn('Missing Feishu credentials');
}

export const ssoProviders = [
  ...(authEnv.AUTH_FEISHU_ID && authEnv.AUTH_FEISHU_SECRET ? [Feishu] : []),
];
