import { authEnv } from '@/config/auth';
import type { OAuthConfig } from 'next-auth/providers';

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

interface FeishuTokenParams {
  code: string;
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

interface FeishuAppTokenResponse {
  code: number;
  msg: string;
  app_access_token?: string;
  expire: number;
}

interface FeishuUserInfoResponse {
  code: number;
  msg: string;
  data: FeishuProfile;
}

const provider = {
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
  idToken: false,
  checks: ['none'],
  clientId: authEnv.AUTH_FEISHU_ID,
  clientSecret: authEnv.AUTH_FEISHU_SECRET,
  token: {
    async request({ params }: { params: FeishuTokenParams }) {
      // 1. 获取 app_access_token
      const appTokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: authEnv.AUTH_FEISHU_ID,
          app_secret: authEnv.AUTH_FEISHU_SECRET,
        }),
      });
      
      const appToken = (await appTokenResponse.json()) as FeishuAppTokenResponse;
      
      if (!appToken.app_access_token) {
        throw new Error('Failed to get app access token: ' + JSON.stringify(appToken));
      }
      
      // 2. 使用授权码获取用户token
      const userTokenResponse = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appToken.app_access_token}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: params.code,
        }),
      });
      
      const userToken = (await userTokenResponse.json()) as FeishuTokenResponse;
      
      if (!userToken.data?.access_token) {
        throw new Error('Failed to get user access token: ' + JSON.stringify(userToken));
      }

      return {
        tokens: {
          access_token: userToken.data.access_token,
          refresh_token: userToken.data.refresh_token,
          expires_at: Date.now() + (userToken.data.expires_in * 1000),
        },
      };
    },
  },
  userinfo: {
    url: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
    async request({ tokens }: { tokens: FeishuTokens }) {
      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
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
} as OAuthConfig<FeishuProfile>;

export default provider;
