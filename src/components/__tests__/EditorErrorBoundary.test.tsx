import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EditorErrorBoundary } from "@/components/EditorErrorBoundary";

// Component that throws an error
function BrokenComponent() {
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

    // adjust text depending on your actual fallback UI
    expect(
      screen.getByText(/something went wrong|error/i)
    ).toBeInTheDocument();
  });
});