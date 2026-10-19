import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AiResponseContent from "./AiResponseContent";

describe("AiResponseContent", () => {
  it("renders file and chunk on the visible citation line without score or confidence while inspector is closed", () => {
    render(
      <AiResponseContent
        text="Here is the live answer."
        sources={[
          {
            file_name: "notes.txt",
            chunk_index: 0,
            score: 0.63,
            score_type: "vector",
          },
        ]}
      />
    );

    expect(screen.getByText("notes.txt · chunk 0")).toBeInTheDocument();
    expect(screen.queryByText(/0\.63/)).not.toBeInTheDocument();
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
  });

  it("shows score details when the retrieval inspector is opened", async () => {
    const user = userEvent.setup();
    render(
      <AiResponseContent
        text="Here is the live answer."
        sources={[
          {
            file_name: "notes.txt",
            chunk_index: 0,
            score: 0.63,
            score_type: "vector",
          },
        ]}
      />
    );

    await user.click(screen.getByText("Retrieval inspector"));

    expect(screen.getByText("0.63")).toBeInTheDocument();
    expect(screen.getByText("vector")).toBeInTheDocument();
  });

  it("includes page number when present and deduplicates repeated sources", () => {
    render(
      <AiResponseContent
        text="Summary from PDF."
        sources={[
          { file_name: "manual.pdf", page_number: 3, chunk_index: 1, score: 0.81 },
          { file_name: "manual.pdf", page_number: 3, chunk_index: 1, score: 0.81 },
        ]}
      />
    );

    expect(screen.getByText("manual.pdf · p.3 · chunk 1")).toBeInTheDocument();
    expect(screen.queryByText(/0\.81/)).not.toBeInTheDocument();
  });

  it("renders no citation line when sources are empty or missing, or while streaming", () => {
    const { rerender } = render(
      <AiResponseContent text="General answer without sources." sources={[]} />
    );

    expect(screen.queryByText(/chunk/i)).not.toBeInTheDocument();

    rerender(<AiResponseContent text="General answer without sources." />);
    expect(screen.queryByText(/chunk/i)).not.toBeInTheDocument();

    rerender(
      <AiResponseContent
        text="Partial token..."
        isStreaming={true}
        detailsVisible={false}
        sources={[{ file_name: "notes.txt", chunk_index: 0, score: 0.63 }]}
      />
    );
    expect(screen.queryByText(/notes\.txt/)).not.toBeInTheDocument();
  });
});
