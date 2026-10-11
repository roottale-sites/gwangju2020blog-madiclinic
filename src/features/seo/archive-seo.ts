import { metadataRoute } from './metadata-contract';
export { loadRouteSeo as loadArchiveSeo } from './route-seo';
export const archiveSeoDefaults = {
  column: metadataRoute('column').defaults,
  reviews: metadataRoute('reviews').defaults,
  faq: metadataRoute('faq').defaults,
};
export type ArchiveSeoKey = keyof typeof archiveSeoDefaults;
