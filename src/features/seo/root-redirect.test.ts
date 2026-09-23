import { expect, test } from 'vitest';

import nextConfig from '../../../next.config';

test('일반 루트 방문은 칼럼으로 301, 팝업 iframe은 기존대로 307 이동한다', async () => {
  expect(await nextConfig.redirects?.()).toEqual([
    {
      source: '/',
      destination: '/column',
      permanent: false,
      has: [{ type: 'header', key: 'sec-fetch-dest', value: 'iframe' }],
    },
    { source: '/', destination: '/column', statusCode: 301 },
  ]);
});
