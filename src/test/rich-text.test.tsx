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
