"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function ChatHistoryPage() {
  interface ChatMessage {
    id: string;
    senderType: string;
    content: string;
    tokens: number;
    sources: { document_id: string }[];
    timestamp: string;
  }

  interface ChatSession {
    id: string;
    createdAt: string;
    topic: string | null;
    sentiment: string;
    messages: ChatMessage[];
  }

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChatHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        setError("Profile not found");
        return;
      }

      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          created_at,
          topic,
          sentiment,
          chat_messages (
            id,
            sender_type,
            content,
            tokens_used,
            sources,
            created_at
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Format for UI
      const formatted = sessions.map((session) => ({
        id: session.id,
        createdAt: session.created_at,
        topic: session.topic,
        sentiment: session.sentiment,
        messages: session.chat_messages.map((msg) => ({
          id: msg.id,
          senderType: msg.sender_type,
          content: msg.content,
          tokens: msg.tokens_used,
          sources: JSON.parse(msg.sources || '[]'),
          timestamp: msg.created_at
        }))
      }));

      setChats(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Failed to fetch chat history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  if (loading) {
    return <div className="flex min-h-[20vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="mt-2 text-sm text-neutral-500">Loading chat history...</p>
      </div>
    </div>;
  }

  if (error) {
    return <div className="bg-rose-50 border-l-4 border-rose-400 text-rose-700 p-4">
      <p>{error}</p>
    </div>;
  }

  if (chats.length === 0) {
    return <div className="flex min-h-[20vh] items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-neutral-500">No chat history yet</p>
        <p className="text-sm">Start a conversation to see history here</p>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-display text-neutral-900">Chat History</h1>
        <div className="text-sm text-neutral-500">
          {chats.reduce((sum, chat) => sum + chat.messages.length, 0)} total messages
        </div>
      </div>

      <div className="space-y-4">
        {chats.map((chat: ChatSession) => (
          <div key={chat.id} className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-neutral-900">
                  {chat.topic || 'Untitled Chat'}
                </h3>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full
                    {chat.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                     chat.sentiment === 'negative' ? 'bg-rose-100 text-rose-800' :
                     'bg-neutral-200 text-neutral-600'}"
                  >
                    {chat.sentiment}
                  </span>
                  <span className="text-neutral-400">
                    • {new Date(chat.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4">
              {chat.messages.map((msg: ChatMessage) => (
                <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'} space-x-3`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                    msg.senderType === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.sources.length > 0 && (
                      <div className="text-xs text-neutral-400 mt-1">
                        Sources: {msg.sources.map((s: { document_id: string }) => s.document_id).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
