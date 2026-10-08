import { cfImageSrcSet, cfImageVariantUrl } from '../cms/cf-image-url';
import type { ColumnFooterImage } from './column-footer-image';

export default function ColumnConsultationPhoto({ image }: Readonly<{ image: ColumnFooterImage | null }>) {
  if (!image) return null;
  return (
    <img
      className="column-consultation-photo"
      src={cfImageVariantUrl(image.src, 'md')}
      srcSet={cfImageSrcSet(image.src)}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes="(max-width: 520px) calc(100vw - 40px), 480px"
      loading="lazy"
      decoding="async"
    />
  );
}
