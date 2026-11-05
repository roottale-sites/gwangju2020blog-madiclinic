import { visualEditorOrigins as sdkOrigins } from '@roottale/cms-core/visual-edit';
export function visualEditorOrigins(): string[] {
  return sdkOrigins(['https://admin.roottale.com', 'https://admin.web.ai.kr', ...(process.env.ROOTTALE_VISUAL_EDITOR_ORIGINS?.split(',') ?? [])]);
}
