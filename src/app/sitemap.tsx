import { MetadataRoute } from 'next';

import { sitemapModule } from '@/server/sitemap';

const Sitemap = (): Promise<MetadataRoute.Sitemap> => {
  return Promise.resolve(sitemapModule.getPage());
};

export default Sitemap;
