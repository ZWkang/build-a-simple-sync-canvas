import { describe, expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { HomePage } from './home-page.tsx';

describe('home page', () => {
  it('describes the browser-only frontend boundary', () => {
    const markup = renderToStaticMarkup(<HomePage />);

    expect(markup).toContain('前端工作区已就绪');
    expect(markup).toContain('API、数据库和运行时职责位于独立后端');
  });
});
