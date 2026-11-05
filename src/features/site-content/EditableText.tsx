import type { ReactNode } from 'react';
import { contentAttributes, verificationAttributes } from './bindings';
export default function EditableText({ owner, field, children }: { owner: unknown; field: string; children: ReactNode }) {
  const attributes = { ...contentAttributes(owner, field), ...verificationAttributes(owner, field) };
  return Object.keys(attributes).length ? <span {...attributes}>{children}</span> : <>{children}</>;
}
