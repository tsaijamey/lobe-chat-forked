import { authEnv } from '@/config/auth';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

interface FeishuProfile {
  name: string;
  en_name: string;
  avatar_url: string;
  avatar_thumb: string;
  avatar_middle: string;
  avatar_big: string;
  open_id: string;
  union_id: string;
  email: string;
  enterprise_email: string;
  user_id: string;
  mobile?: string;
  tenant_key: string;
  employee_no?: string;
}

interface FeishuTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

interface FeishuTokenParams {
  code: string;
  state?: string;
  redirect_uri?: string;
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
      state: process.env.NEXTAUTH_SECRET,
      scope: '',  // 显式设置为空字符串，防止 NextAuth 添加默认 scope
    },
  },
  token: {
    url: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
    async request({ params, client }: { params: FeishuTokenParams, client: { client_id: string; client_secret: string } }) {
      // 验证 state 参数
      if (params.state !== process.env.NEXTAUTH_SECRET) {
        throw new Error('Invalid state parameter');
      }

      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: params.code,
          app_id: client.client_id,
          app_secret: client.client_secret,
        }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.msg || 'Failed to get access token');
      }

      return {
        access_token: data.data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + data.data.expires_in,
      };
    }
  },
  userinfo: {
    url: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
    async request({ tokens }: { tokens: FeishuTokens }) {
      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      const userInfo = await response.json();

      if (userInfo.code !== 0) {
        console.error('Failed to get user info:', userInfo);
        throw new Error(`Failed to get user info: ${userInfo.msg}`);
      }

      if (!userInfo.data) {
        throw new Error('User info response missing data');
      }

      // 确保返回所有必需的字段
      const requiredFields = ['name', 'open_id', 'union_id'];
      for (const field of requiredFields) {
        if (!userInfo.data[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
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
      email: email,
      avatar: profile.avatar_url || profile.avatar_big,
      firstName: profile.name,
      fullName: profile.name,
      username: profile.en_name || profile.name,
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