import { render, screen, fireEvent } from "@testing-library/react";
import { ImageAdjustments } from "@/components/ImageAdjustments";

describe("ImageAdjustments", () => {
  const mockOnAdjustmentChange = jest.fn();
  const mockOnReset = jest.fn();

  const defaultProps = {
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      highlights: 0,
      shadows: 0,
    },
    onAdjustmentChange: mockOnAdjustmentChange,
    onReset: mockOnReset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders adjustment sliders", () => {
    render(<ImageAdjustments {...defaultProps} />);

    expect(screen.getByText("Brightness")).toBeInTheDocument();
    expect(screen.getByText("Contrast")).toBeInTheDocument();
    expect(screen.getByText("Saturation")).toBeInTheDocument();
    expect(screen.getByText("Warmth")).toBeInTheDocument();
    expect(screen.getByText("Highlights")).toBeInTheDocument();
    expect(screen.getByText("Shadows")).toBeInTheDocument();
  });

  it("displays current adjustment values", () => {
    const props = {
      ...defaultProps,
      adjustments: {
        brightness: 50,
        contrast: -30,
        saturation: 20,
        warmth: 10,
        highlights: 0,
        shadows: 0,
      },
    };

    render(<ImageAdjustments {...props} />);

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("-30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("calls onAdjustmentChange when slider is moved", () => {
    render(<ImageAdjustments {...defaultProps} />);

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "25" } });

    expect(mockOnAdjustmentChange).toHaveBeenCalledWith("brightness", 25);
  });

  it("calls onReset when reset button is clicked", () => {
    render(<ImageAdjustments {...defaultProps} />);

    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalled();
  });

  it("renders filter buttons in Filters tab", () => {
    render(<ImageAdjustments {...defaultProps} />);

    const filtersTab = screen.getByText("Filters");
    fireEvent.click(filtersTab);

    expect(screen.getByText("Warm")).toBeInTheDocument();
    expect(screen.getByText("Cool")).toBeInTheDocument();
    expect(screen.getByText("Vintage")).toBeInTheDocument();
    expect(screen.getByText("Vibrant")).toBeInTheDocument();
    expect(screen.getByText("Grayscale")).toBeInTheDocument();
    expect(screen.getByText("Sepia")).toBeInTheDocument();
  });

  it("switches between Tune and Filters tabs", () => {
    render(<ImageAdjustments {...defaultProps} />);

    const filtersTab = screen.getByText("Filters");
    fireEvent.click(filtersTab);

    expect(screen.getByText("Warm")).toBeInTheDocument();

    const tuneTab = screen.getByText("Tune");
    fireEvent.click(tuneTab);

    expect(screen.getByText("Brightness")).toBeInTheDocument();
  });
});
