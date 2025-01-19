import { authEnv } from '@/config/auth';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

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

interface FeishuTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

interface FeishuTokenResponse {
  code: number;
  msg: string;
  data?: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

interface FeishuUserInfoResponse {
  code: number;
  msg: string;
  data: FeishuProfile;
}

const feishuProvider = (config: OAuthUserConfig<FeishuProfile>): OAuthConfig<FeishuProfile> => ({
  id: 'feishu',
  name: 'Feishu',
  type: 'oauth',
  authorization: {
    url: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
    params: {
      app_id: authEnv.AUTH_FEISHU_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/feishu`,
      response_type: 'code',
    },
  },
  token: {
    url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
  },
  userinfo: {
    url: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
    async request({ tokens }: { tokens: FeishuTokens }) {
      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const userInfo = (await response.json()) as FeishuUserInfoResponse;

      if (!userInfo.data || !userInfo.data.open_id) {
        throw new Error('Invalid user info received: ' + JSON.stringify(userInfo));
      }

      return userInfo.data;
    },
  },
  profile(profile: FeishuProfile) {
    const email = profile.enterprise_email || profile.email;
    const allowedDomain = authEnv.AUTH_FEISHU_ALLOWED_DOMAIN;

    if (allowedDomain && !email?.endsWith(`@${allowedDomain}`)) {
      throw new Error(`Unauthorized email domain. Only @${allowedDomain} is allowed.`);
    }

    return {
      id: profile.open_id,
      name: profile.name || profile.open_id,
      email: email,
      image: profile.avatar_url || profile.avatar_big,
      firstName: profile.name,
      providerAccountId: profile.open_id,
    };
  },
  clientId: config.clientId || authEnv.AUTH_FEISHU_ID,
  clientSecret: config.clientSecret || authEnv.AUTH_FEISHU_SECRET,
  checks: ['none'],
  style: {
    logo: '/feishu-logo.svg',
    bg: '#00D6B9',
    text: '#000000',
  },
});

const provider = {
  id: 'feishu',
  provider: feishuProvider({}) as OAuthConfig<FeishuProfile>,
};

export default provider;
