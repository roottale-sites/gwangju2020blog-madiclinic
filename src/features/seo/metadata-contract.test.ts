import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, test } from 'vitest';
import { contentMetadataDefaults, metadataRoutePath, metadataRoutes } from './metadata-contract';
import contract from '../../../cms/site-content-contract.json';

function pageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? pageFiles(path) : entry.name === 'page.tsx' ? [path] : [];
  });
}

describe('배포할 페이지의 메타데이터 계약', () => {
  test('실제 공개 고정 페이지를 빠짐없이 등록하고 모든 route key와 주소가 유일하다', () => {
    const app = join(process.cwd(), 'src/app');
    const paths = pageFiles(app).map((file) => relative(app, file).replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, ''))
      .filter((path) => !path.includes('[') && !path.startsWith('preview/')).map((path) => `/${path}`);
    expect(metadataRoutes.map(metadataRoutePath).sort()).toEqual(paths.sort());
    expect(new Set(metadataRoutes.map((route) => route.routeKey)).size).toBe(metadataRoutes.length);
    expect(new Set(metadataRoutes.map(metadataRoutePath)).size).toBe(metadataRoutes.length);
    for (const file of pageFiles(app).filter((path) => !path.includes('['))) {
      expect(readFileSync(file, 'utf8')).toContain('generateMetadata');
    }
  });

  test('본문 없는 화면을 가짜 CMS page로 만들지 않고 글·분류 어댑터 지원을 선언한다', () => {
    expect(contract.pages).toEqual([]);
    for (const kind of [contract.metadata.posts, contract.metadata.terms]) {
      expect(kind.supportedFields).toContain('ogImage');
      expect(kind.supportedFields).toContain('noindex');
      expect(kind.supportedFields).toContain('nofollow');
    }
  });

  test('자동 제목에 달러 문자가 있어도 관리 API와 같은 템플릿으로 해석한다', () => {
    const modelKey = Object.keys(contract.metadata.posts.titleTemplates)[0]!;
    const defaults = contentMetadataDefaults({ kind: 'posts', modelKey, title: '치료 $& 안내' });
    expect(defaults.title).toContain('치료 $& 안내');
  });
});
