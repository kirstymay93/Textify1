import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectOverview } from "@/components/ProjectOverview";

describe("ProjectOverview", () => {
  const mockOnSnapshotSelect = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnShare = jest.fn();

  const defaultProps = {
    projectTitle: "Test Project",
    lastSavedAt: Date.now() - 60000, // 1 minute ago
    history: [
      {
        id: "snap-1",
        timestamp: Date.now() - 60000,
        name: "Edit 1",
        thumbnail: "data:image/png;base64,iVBORw0KGgo=",
      },
      {
        id: "snap-2",
        timestamp: Date.now() - 120000,
        name: "Edit 2",
        thumbnail: "data:image/png;base64,iVBORw0KGgo=",
      },
    ],
    onSnapshotSelect: mockOnSnapshotSelect,
    onExport: mockOnExport,
    onShare: mockOnShare,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders project title", () => {
    render(<ProjectOverview {...defaultProps} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("displays last saved time", () => {
    render(<ProjectOverview {...defaultProps} />);
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it("renders Share and Export buttons", () => {
    render(<ProjectOverview {...defaultProps} />);
    expect(screen.getByText("Share")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("calls onShare when Share button is clicked", () => {
    render(<ProjectOverview {...defaultProps} />);
    const shareButton = screen.getByText("Share");
    fireEvent.click(shareButton);
    expect(mockOnShare).toHaveBeenCalled();
  });

  it("calls onExport when Export button is clicked", () => {
    render(<ProjectOverview {...defaultProps} />);
    const exportButton = screen.getByText("Export");
    fireEvent.click(exportButton);
    expect(mockOnExport).toHaveBeenCalled();
  });

  it("renders history snapshots", () => {
    render(<ProjectOverview {...defaultProps} />);
    expect(screen.getByText("Edit 1")).toBeInTheDocument();
    expect(screen.getByText("Edit 2")).toBeInTheDocument();
  });

  it("calls onSnapshotSelect when snapshot is clicked", () => {
    render(<ProjectOverview {...defaultProps} />);
    const snapshot = screen.getByText("Edit 1");
    fireEvent.click(snapshot);
    expect(mockOnSnapshotSelect).toHaveBeenCalledWith("snap-1");
  });

  it("displays version count", () => {
    render(<ProjectOverview {...defaultProps} />);
    expect(screen.getByText("2 versions")).toBeInTheDocument();
  });

  it("displays 'No edits yet' when history is empty", () => {
    const props = {
      ...defaultProps,
      history: [],
    };
    render(<ProjectOverview {...props} />);
    expect(screen.getByText("No edits yet")).toBeInTheDocument();
  });

  it("displays correct singular version text", () => {
    const props = {
      ...defaultProps,
      history: [defaultProps.history[0]],
    };
    render(<ProjectOverview {...props} />);
    expect(screen.getByText("1 version")).toBeInTheDocument();
  });
});
