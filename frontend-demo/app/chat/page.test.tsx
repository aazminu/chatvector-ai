import { useState, createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPage from "./page";
import type { AttachmentState } from "../lib/api";
import type { RetrievalScope, RetrievalSettings } from "../lib/retrievalSettings";

let mockAttachment: AttachmentState | null = null;
let mockInitialScope: RetrievalScope = "session";

vi.mock("../lib/hooks/useSessionManager", () => ({
  useSessionManager: () => ({
    sessions: [{ id: "session-1", title: "Session 1", createdAt: 1 }],
    activeSessionId: "session-1",
    createNewSession: vi.fn(),
    switchSession: vi.fn(),
    deleteSession: vi.fn(),
    isLoaded: true,
    error: null,
    isCreating: false,
    deletingSessionId: null,
  }),
}));

vi.mock("../lib/hooks/useRetrievalSettings", () => ({
  useRetrievalSettings: () => {
    const [settings, setSettings] = useState<RetrievalSettings>({
      scope: mockInitialScope,
      matchCount: 5,
    });
    return {
      settings,
      setScope: (scope: RetrievalScope) =>
        setSettings((prev) => ({ ...prev, scope })),
      setMatchCount: (matchCount: number) =>
        setSettings((prev) => ({ ...prev, matchCount })),
      loaded: true,
    };
  },
}));

vi.mock("../lib/hooks/useChat", () => ({
  useChat: () => ({
    messages: [],
    historyLoading: false,
    input: "",
    setInput: vi.fn(),
    inflight: false,
    streaming: false,
    attachment: mockAttachment,
    sessionNotice: null,
    removeError: null,
    sendDisabled: true,
    bottomRef: createRef<HTMLDivElement>(),
    poll: {
      stage: undefined,
      completedStages: [],
      chunks: undefined,
      awaitingProcessing: false,
      queuePosition: undefined,
      processingTime: undefined,
      errorMessage: undefined,
      status: undefined,
    },
    handleSend: vi.fn(),
    handleKeyDown: vi.fn(),
    handleBeforeUpload: vi.fn(),
    handleUploadAccepted: vi.fn(),
    handleRemoveAttachment: vi.fn(),
    stopStreaming: vi.fn(),
  }),
}));

describe("ChatPage scope indicator", () => {
  beforeEach(() => {
    mockInitialScope = "session";
    mockAttachment = {
      fileName: "notes.txt",
      documentId: "doc-1",
      statusEndpoint: "/documents/doc-1/status",
      status: "ready",
    };
  });

  it("shows the active scope with the selected document without opening developer settings, and updates when toggling tenant and session", async () => {
    const { container } = render(<ChatPage />);

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    expect(
      screen.getByText("Session scope: searches only the selected document (notes.txt).")
    ).toBeVisible();

    await userEvent.click(screen.getByText("Retrieval settings"));
    await userEvent.click(screen.getByRole("radio", { name: "Tenant" }));

    expect(
      screen.getByText(
        "Tenant scope: searches the tenant's ready documents (can include documents other than the attached chip)."
      )
    ).toBeVisible();

    await userEvent.click(screen.getByRole("radio", { name: "Session" }));

    expect(
      screen.getByText("Session scope: searches only the selected document (notes.txt).")
    ).toBeVisible();
  });

  it("does not claim a document is searched when no document is attached in session scope", () => {
    mockAttachment = null;
    render(<ChatPage />);

    const indicator = screen.getByTestId("chat-scope-indicator");
    expect(indicator).toHaveTextContent(
      "Session scope: no document selected — upload a document to search it."
    );
  });
});
