import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders children text", () => {
    render(<Button>Save</Button>);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});