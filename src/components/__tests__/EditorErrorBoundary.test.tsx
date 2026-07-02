import { render, screen } from '@testing-library/react';
import { EditorErrorBoundary } from '../EditorErrorBoundary';

describe('EditorErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <EditorErrorBoundary>
        <div>Test content</div>
      </EditorErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error message when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <EditorErrorBoundary>
        <ThrowError />
      </EditorErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
