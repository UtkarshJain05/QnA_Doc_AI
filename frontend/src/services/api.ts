const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function uploadPDF(file: File): Promise<{ session_id: string; chunks_created: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to upload PDF");
  }

  return response.json();
}

export async function askQuestion(question: string, sessionId: string): Promise<{ answer: string }> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, session_id: sessionId }),
  });

  if (!response.ok) {
    throw new Error("Failed to get answer");
  }

  return response.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete session");
  }
}
