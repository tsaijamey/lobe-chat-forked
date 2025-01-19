import { authEnv } from '@/config/auth';
import type { OAuthConfig } from 'next-auth/providers';

import { CommonProviderConfig } from './sso.config';

interface FeishuProfile {
  avatar_url: string;
  avatar_thumb: string;
  avatar_middle: string;
  avatar_big: string;
  user_id: string;
  union_id: string;
  open_id: string;
  en_name: string;
  name: string;
  email: string;
  enterprise_email: string;
  tenant_key: string;
}

interface FeishuClient {
  client_id: string;
  client_secret: string;
}

interface FeishuTokens {
  access_token: string;
}

const provider = {
  id: 'feishu',
  provider: {
    id: 'feishu',
    name: 'Feishu',
    type: 'oauth',
    authorization: {
      params: {
        app_id: authEnv.AUTH_FEISHU_ID,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/feishu`,
        scope: 'contact:user.employee,contact:user.base,email',
        response_type: 'code',
      },
      url: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
    },
    clientId: authEnv.AUTH_FEISHU_ID,
    clientSecret: authEnv.AUTH_FEISHU_SECRET,
    profile(profile: FeishuProfile) {
      const email = profile.enterprise_email || profile.email;
      const allowedDomain = authEnv.AUTH_FEISHU_ALLOWED_DOMAIN;

      if (allowedDomain && !email?.endsWith(`@${allowedDomain}`)) {
        throw new Error(`Unauthorized email domain. Only @${allowedDomain} is allowed.`);
      }

      return {
        id: profile.union_id || profile.user_id,
        name: profile.name,
        email: email,
        image: profile.avatar_url || profile.avatar_big,
      };
    },
    token: {
      url: 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      async request({ client }: { client: FeishuClient }) {
        const response = await fetch(
          'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              app_id: client.client_id,
              app_secret: client.client_secret,
            }),
          },
        );
        const data = await response.json();

        return {
          tokens: { access_token: data.tenant_access_token },
        };
      },
    },
    userinfo: {
      url: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
      async request({ tokens }: { tokens: FeishuTokens }) {
        const response = await fetch(
          'https://open.feishu.cn/open-apis/authen/v1/user_info',
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const data = await response.json();
        return data.data;
      },
    },
  } as OAuthConfig<FeishuProfile>,
};

export default provider;
