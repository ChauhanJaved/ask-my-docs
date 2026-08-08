import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    // Verify organization exists and user has access (optional but recommended)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id !== orgId) {
        return NextResponse.json({ error: "Unauthorized for this organization" }, { status: 403 });
      }
    }

    // Return the widget HTML
    const widgetHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FTChat Widget</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: system-ui, sans-serif; }
          #widget-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 360px;
            height: 580px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            background: white;
            z-index: 1000;
          }
          #widget-header {
            background: #6366f1;
            color: white;
            padding: 16px;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          #widget-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.25rem;
            cursor: pointer;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #widget-chat {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f9fafb;
          }
          #widget-messages {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .message {
            max-width: 80%;
          }
          .message.user {
            align-self: flex-end;
          }
          .message.assistant {
            align-self: flex-start;
          }
          .message-content {
            padding: 10px 14px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.4;
          }
          .message.user .message-content {
            background: #6366f1;
            color: white;
          }
          .message.assistant .message-content {
            background: #f3f4f6;
            color: #1f2937;
          }
          .message-sources {
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 4px;
          }
          #widget-input {
            display: flex;
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            gap: 10px;
          }
          #widget-input input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.95rem;
          }
          #widget-input input:focus {
            outline: none;
            border-color: #6366f1;
            ring: 2px;
          }
          #widget-input button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 0 20px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
          }
          #widget-input button:hover {
            background: #4f46e5;
          }
          #widget-input button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          #widget-status {
            font-size: 0.75rem;
            text-align: center;
            color: #6b7280;
            padding: 8px 0;
          }
        </style>
      </head>
      <body>
        <div id="widget-container">
          <div id="widget-header">
            <div>FTChat Assistant</div>
            <button id="widget-close" aria-label="Close chat">×</button>
          </div>
          <div id="widget-chat">
            <div id="widget-messages"></div>
            <div id="widget-status">Ready to chat...</div>
          </div>
          <div id="widget-input">
            <input type="text" id="widget-input-field" placeholder="Ask a question..." autocomplete="off" />
            <button id="widget-send-btn">Send</button>
          </div>
        </div>
        <script>
          // Widget client-side logic
          (function() {
            const orgId = '${orgId}';
            const container = document.getElementById('widget-container');
            const closeBtn = document.getElementById('widget-close');
            const chatDiv = document.getElementById('widget-messages');
            const statusDiv = document.getElementById('widget-status');
            const input = document.getElementById('widget-input-field');
            const sendBtn = document.getElementById('widget-send-btn');

            let currentSessionId = localStorage.getItem('ftchat_session_' + orgId) || null;
            let isProcessing = false;

            // Add message to chat UI
            function addMessage({ content, isUser, sources = [] }) {
              const messageDiv = document.createElement('div');
              messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');

              const contentDiv = document.createElement('div');
              contentDiv.className = 'message-content';
              contentDiv.textContent = content;
              messageDiv.appendChild(contentDiv);

              if (sources.length > 0) {
                const sourcesDiv = document.createElement('div');
                sourcesDiv.className = 'message-sources';
                sourcesDiv.textContent = 'Sources: ' + sources.map(s => \`[\${s.substring(0, 8)}...\`]).join(', ');
                messageDiv.appendChild(sourcesDiv);
              }

              chatDiv.appendChild(messageDiv);
              chatDiv.scrollTop = chatDiv.scrollHeight;
            }

            // Set status message
            function setStatus(message, isError = false) {
              statusDiv.textContent = message;
              statusDiv.style.color = isError ? '#ef4444' : '#6b7280';
            }

            // Send message to API
            async function sendMessage() {
              if (isProcessing || !input.value.trim()) return;

              const message = input.value.trim();
              input.value = '';

              // Add user message to chat immediately
              addMessage({ content: message, isUser: true });
              setStatus('Thinking...');
              isProcessing = true;
              sendBtn.disabled = true;

              try {
                const response = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message,
                    sessionId: currentSessionId
                  })
                });

                if (!response.ok) {
                  throw new Error(\`Server error: \${response.status}\`);
                }

                const data = await response.json();

                // Update session ID
                if (data.sessionId) {
                  currentSessionId = data.sessionId;
                  localStorage.setItem('ftchat_session_' + orgId, currentSessionId);
                }

                // Add assistant message
                addMessage({
                  content: data.answer,
                  isUser: false,
                  sources: data.sources?.map(s => s.documentId) || []
                });

                setStatus('Ready to chat...');
              } catch (error) {
                console.error('Widget chat error:', error);
                addMessage({
                  content: 'Sorry, I encountered an error. Please try again.',
                  isUser: false
                });
                setStatus('Error occurred', true);
              } finally {
                isProcessing = false;
                sendBtn.disabled = false;
              }
            }

            // Event listeners
            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') sendMessage();
            });

            closeBtn.addEventListener('click', () => {
              container.style.display = 'none';
            });

            // Initialize with welcome message
            addMessage({
              content: 'Hello! I\'m your FTChat assistant. How can I help you today?',
              isUser: false
            });
          })();
        </script>
      </body>
      </html>
    `;

    return new Response(widgetHtml, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Widget generation failed" }, { status: 500 });
  }
}