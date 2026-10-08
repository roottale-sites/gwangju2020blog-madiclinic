import { formatMetadataDefaults, MetadataDefaultRulesSchema } from '@roottale/cms-core';
import contract from '../../../cms/site-content-contract.json';

/** 배포 계약과 SSR 기본값은 이 원장 하나를 사용한다. */
export const metadataRoutes = contract.metadata.routes;

export function metadataRoute(routeKey: string) {
  const route = metadataRoutes.find((entry) => entry.routeKey === routeKey);
  if (!route) throw new Error(`등록되지 않은 메타데이터 경로: ${routeKey}`);
  return route;
}

export function metadataRoutePath(route: (typeof metadataRoutes)[number]): string {
  const source = route.source;
  if ('path' in source && typeof source.path === 'string') return source.path;
  if (!('modelKey' in source)) throw new Error(`목록 모델이 없는 경로: ${route.routeKey}`);
  const model = contract.models.find((entry) => entry.modelKey === source.modelKey);
  if (!model?.listPath) throw new Error(`목록 경로가 없는 메타데이터 모델: ${route.routeKey}`);
  return model.listPath;
}

export function metadataRouteForPath(path: string) {
  const route = metadataRoutes.find((entry) => metadataRoutePath(entry) === path);
  if (!route) throw new Error(`등록되지 않은 메타데이터 주소: ${path}`);
  return route;
}

export function metadataDefaultsForPath(path: string) {
  return metadataRouteForPath(path).defaults;
}

/** 제목 서식은 자동값에만 적용한다. 직접 설정한 SEO 제목은 그대로 사용한다. */
export function metadataTitle(kind: 'posts' | 'terms', modelKey: string, title: string): string {
  const templates: Readonly<Record<string, string>> = contract.metadata[kind].titleTemplates;
  const declaration = kind === 'posts' ? { posts: { titleTemplates: templates } } : { terms: { titleTemplates: templates } };
  return formatMetadataDefaults({ kind, modelKey, title }, declaration).title ?? title;
}

const metadataDeclaration = {
  posts: {
    titleTemplates: contract.metadata.posts.titleTemplates,
    defaultRules: Object.fromEntries(Object.entries(contract.metadata.posts.defaultRules)
      .map(([key, value]) => [key, MetadataDefaultRulesSchema.parse(value)])),
  },
  terms: {
    titleTemplates: contract.metadata.terms.titleTemplates,
    defaultRules: Object.fromEntries(Object.entries(contract.metadata.terms.defaultRules)
      .map(([key, value]) => [key, MetadataDefaultRulesSchema.parse(value)])),
  },
};

export function contentMetadataDefaults(input: Parameters<typeof formatMetadataDefaults>[0]) {
  return formatMetadataDefaults(input, metadataDeclaration);
}
