import { flatten } from 'lodash-es';
import { MetadataRoute } from 'next';
import urlJoin from 'url-join';

import { DEFAULT_LANG } from '@/const/locale';
import { Locales, locales as allLocales } from '@/locales/resources';

export interface SitemapItem {
  alternates?: {
    languages?: string;
  };
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastModified?: string | Date;
  priority?: number;
  url: string;
}

export enum SitemapType {
  Pages = 'pages',
}

class Sitemap {
  sitemapIndexs = [{ id: SitemapType.Pages }];

  private _generateSitemapLink(url: string) {
    return urlJoin(process.env.NEXT_PUBLIC_SITE_URL || '', url);
  }

  private _formatTime(time?: string) {
    if (!time) return new Date().toISOString();
    return new Date(time).toISOString();
  }

  private _genSitemapItem = (
    lang: Locales,
    url: string,
    {
      lastModified,
      changeFrequency = 'monthly',
      priority = 0.4,
      noLocales,
      locales = allLocales,
    }: {
      changeFrequency?: SitemapItem['changeFrequency'];
      lastModified?: string;
      locales?: typeof allLocales;
      noLocales?: boolean;
      priority?: number;
    } = {},
  ) => {
    const sitemap = {
      changeFrequency,
      lastModified: this._formatTime(lastModified),
      priority,
      url: this._generateSitemapLink(
        lang === DEFAULT_LANG ? url : `${url}?hl=${lang}`,
      ),
    };

    if (noLocales) return sitemap;

    const languages: Record<string, string> = {};
    for (const locale of locales) {
      if (locale === lang) continue;
      languages[locale] = this._generateSitemapLink(`${url}?hl=${locale}`);
    }

    return {
      alternates: { languages },
      ...sitemap,
    };
  };

  getPage(): MetadataRoute.Sitemap {
    const staticPages = [
      '/',
      '/chat',
      '/settings',
      '/settings/common',
      '/settings/llm',
      '/settings/tts',
      '/settings/agent',
      '/settings/plugin',
    ];

    return flatten(
      staticPages.map((page) =>
        allLocales.map((lang) =>
          this._genSitemapItem(lang, page, {
            changeFrequency: 'weekly',
            priority: page === '/' ? 1 : 0.8,
          }),
        ),
      ),
    );
  }

  getRobots(): string {
    return `
User-agent: *
Allow: /
Sitemap: ${this._generateSitemapLink('/sitemap.xml')}
    `.trim();
  }
}

export const sitemapModule = new Sitemap();
