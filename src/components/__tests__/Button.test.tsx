import { render, screen } from '@testing-library/react';
import { Button } from '../ui/button';

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders button with correct variant classes', () => {
    const { container } = render(<Button variant="outline">Button</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border');
  });

  it('renders button with correct size classes', () => {
    const { container } = render(<Button size="lg">Button</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('h-10');
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(onClick).toHaveBeenCalled();
  });
});
