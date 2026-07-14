import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EditorErrorBoundary } from "@/components/EditorErrorBoundary";

// Component that throws an error — must return JSX (never null/void) to satisfy React types
function BrokenComponent(): JSX.Element {
  throw new Error("Test error");
}

describe("EditorErrorBoundary", () => {
  beforeEach(() => {
    // prevent noisy test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("catches errors and shows fallback UI", () => {
    render(
      <EditorErrorBoundary>
        <BrokenComponent />
      </EditorErrorBoundary>
    );

    // The fallback UI renders both a heading and a description that match the regex,
    // so we use getAllByText and assert at least one element is present.
    const matches = screen.getAllByText(/something went wrong|error/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toBeInTheDocument();
  });
});