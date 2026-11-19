import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichText } from '@/components/RichText';

describe('RichText', () => {
  it('renders color and bold Rising World tags', () => {
    render(<RichText text={'<color=#00FFFF>Ice <b>World</b></color>'} />);

    const colored = screen.getByText('Ice');
    expect(colored).toHaveStyle({ color: '#00FFFF' });
    expect(screen.getByText('World').tagName).toBe('STRONG');
  });

  it('treats bare color tags as closing tags', () => {
    render(<RichText text={'<color=#00FFFF>Blue<color> normal'} />);

    expect(screen.getByText('Blue')).toHaveStyle({ color: '#00FFFF' });
    expect(screen.getByText(/normal/)).not.toHaveStyle({ color: '#00FFFF' });
  });
});


describe('safe description layout tags', () => {
  it('renders alignment and all supported line break forms', () => {
    const { container } = render(<RichText text={'<align=center><b>Title</b><br>First<br/>Second<BR />Third</align>Tail'} />);
    expect(screen.getByText('Title').parentElement).toHaveStyle({ textAlign: 'center', display: 'block' });
    expect(container.querySelectorAll('br')).toHaveLength(3);
    expect(screen.getByText('Tail')).not.toHaveStyle({ textAlign: 'center' });
  });

  it('keeps arbitrary HTML attributes and invalid alignments as text', () => {
    const text = '<align=expression(alert(1))>x</align><br onclick=alert(1)><script>alert(1)</script>';
    const { container } = render(<RichText text={text} />);
    expect(container.textContent).toBe(text);
    expect(container.querySelector('script, br, [onclick]')).toBeNull();
  });

  it('renders links only when enabled and keeps unsupported URLs and attributes as text', () => {
    const valid = '<a href="https://example.org/">Site</a>';
    const { container, rerender } = render(<RichText text={valid} />);
    expect(container.textContent).toBe(valid);
    expect(screen.queryByRole('link')).toBeNull();

    const invalid = `<a href="javascript:void(0)">Script</a><a href="//example.org/">Relative</a><a href="https://example.org/" onclick="void(0)">Attribute</a>`;
    rerender(<RichText text={invalid} allowLinks />);
    expect(container.textContent).toBe(invalid);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
