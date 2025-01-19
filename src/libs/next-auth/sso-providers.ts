import type { NextAuthConfig } from 'next-auth';
import FeishuProvider from 'next-auth/providers/feishu';

export const ssoProviders = [
  {
    id: 'feishu',
    provider: FeishuProvider({
      clientId: process.env.FEISHU_CLIENT_ID,
      clientSecret: process.env.FEISHU_CLIENT_SECRET,
    }),
  },
];
