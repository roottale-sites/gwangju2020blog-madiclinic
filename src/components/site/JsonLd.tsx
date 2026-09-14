import type { JsonLdNode } from '../../features/seo/schema';
import { schemaDocument } from '../../features/seo/schema';

export default function JsonLd({ nodes }: Readonly<{ nodes: readonly JsonLdNode[] }>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaDocument(nodes)).replaceAll('<', '\\u003c') }}
    />
  );
}
