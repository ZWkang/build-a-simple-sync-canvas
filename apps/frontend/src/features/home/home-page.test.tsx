import { describe, expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { HomeView } from './home-page.tsx';

describe('home page', () => {
  it('describes the collaborative Canvas product and access boundary', () => {
    const markup = renderToStaticMarkup(
      <HomeView
        canvases={[]}
        loading={false}
        onCreate={async () => {}}
        onDelete={async () => {}}
        onRename={async () => {}}
      />,
    );

    expect(markup).toContain('把想法放到同一张画布上');
    expect(markup).toContain('获得链接即可编辑，无权限控制');
    expect(markup).toContain('还没有 Canvas');
  });
});
