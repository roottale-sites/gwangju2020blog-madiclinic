import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPostPreview } from '@roottale/cms-client/server';
import { checkPreviewCompatibility, RootTaleVisualEditBridge } from '@roottale/cms-renderer-next/visual-edit';
import contract from '../../../../../cms/site-content-contract.json';
import receipt from '../../../../../cms/content-runtime-receipt.json';
import SharedContentPreview from '../../../../features/site-content/SharedContentPreview';
import { documentFromPost } from '../../../../features/site-content/source';
import { sharedModels } from '../../../../features/site-content/defaults';
import { visualEditorOrigins } from '../../../../features/site-content/preview-origins';
import '../../../../styles/site/column.css';
import '../../../../styles/site/post-pattern.css';
import '../../../../styles/site/review-detail.css';
import '../../../../styles/site/reviews.css';
import '../../../../styles/site/faq-detail.css';
import '../../../../styles/site/faq.css';
import '../../../../styles/site/site-content-preview.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = { title: '콘텐츠 미리보기', robots: { index: false, follow: false }, referrer: 'no-referrer' };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string | string[] }> };
export default async function Page({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.token === 'string' ? query.token.trim() : '';
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!token || !apiKey || apiKey === 'local_unconfigured') notFound();
  const post = await fetchPostPreview({ apiKey, baseUrl: process.env.ROOTTALE_API_BASE,
    siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID, token }).catch(() => null);
  if (!post || post.id !== id || post.preview.visualTarget?.entityId !== id) notFound();
  if (!checkPreviewCompatibility(post.preview.visualTarget, receipt, contract.visualEditing.templateVersion)) {
    return <main id="main"><h1>미리보기 갱신이 필요합니다</h1><p>사이트 계약을 다시 설치한 뒤 미리보기를 열어 주세요.</p></main>;
  }
  const document = documentFromPost(post);
  const model = sharedModels.find(model => model.key === document?.modelKey);
  if (!document || !model) notFound();
  return <>
    <SharedContentPreview modelKey={model.key} content={{ documents: [document], previewId: id }} />
    <RootTaleVisualEditBridge receipt={{ ...post.preview.visualTarget, dependencyVersions: {} }}
      allowedOrigins={visualEditorOrigins()} allowedPaths={[]} />
  </>;
}
