"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";

export default function DocumentsPage() {
  interface Document {
    id: string;
    name: string;
    size: number;
    type: string;
    status: string;
    created_at: string;
  }

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.documents as Document[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      // Reset file input
      e.target.value = "";

      // Refresh documents list
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Refresh documents list
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error deleting document:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading documents...</div>;
  }

  if (error) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-400 text-rose-700 p-4 mb-6">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900">Knowledge Documents</h1>
          <p className="text-sm text-neutral-500">Sync text files, Markdown files, or crawl websites to teach your AI bot.</p>
        </div>
        <div className="flex space-x-3">
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            + Ingest File
          </Button>
          <input
            type="file"
            id="file-input"
            accept=".pdf,.txt,.md,.docx"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></span>
          )}
        </div>
      </div>

      {/* Upload Status */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-400 text-rose-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold text-sm text-neutral-900">Ingested Sources ({documents.length})</h3>
        </div>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No documents uploaded yet. Click &quot;Ingest File&quot; to get started.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
                <th className="px-6 py-3">Source Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Ingested At</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {doc.name}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {doc.type.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${doc.status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : doc.status === "ready"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    } text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-neutral-400 hover:text-neutral-600 mr-4 font-semibold"
                      onClick={() => alert(`View chunks for ${doc.name}`)}
                    >
                      View Chunks
                    </button>
                    <button
                      className="text-rose-600 hover:text-rose-800 font-semibold"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
