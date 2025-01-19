import type { NextAuthConfig } from 'next-auth';
import { FeishuProvider } from './sso-providers/feishu';

if (!process.env.FEISHU_CLIENT_ID || !process.env.FEISHU_CLIENT_SECRET) {
  console.warn('Missing Feishu credentials');
}

export const ssoProviders = [
  ...(process.env.FEISHU_CLIENT_ID && process.env.FEISHU_CLIENT_SECRET
    ? [{
        id: 'feishu',
        provider: FeishuProvider({
          clientId: process.env.FEISHU_CLIENT_ID,
          clientSecret: process.env.FEISHU_CLIENT_SECRET,
        }),
      }]
    : []),
];
