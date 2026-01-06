import { useState,useEffect } from 'react'
import { useRef } from 'react';
import type { FormEvent } from 'react';
import './App.css'

function App() {
  const [chatInput, setChatInput] = useState('');
  const [chatEvents, setChatEvents] = useState<{ type: string; value: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatController = useRef<AbortController | null>(null);

  // Stateless chat handler
  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setChatEvents([]);
    setChatLoading(true);
    if (chatController.current) chatController.current.abort();
    const controller = new AbortController();
    chatController.current = controller;
    try {
      const response = await fetch('http://localhost:8080/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: chatInput }),
        signal: controller.signal,
      });
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      let fullText = '';
      const decoder = new TextDecoder();
      let doneReceived = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines
        chunk.split(/\n/).forEach(line => {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              setChatEvents(evts => [...evts, { type: 'done', value: '[DONE]' }]);
              doneReceived = true;
              return;
            }
            try {
              const obj = JSON.parse(data);
              if (obj.type === 'status') {
                setChatEvents(evts => [...evts, { type: 'status', value: obj.msg }]);
              } else if (obj.type === 'token') {
                fullText += obj.text;
                setChatEvents(evts => [...evts, { type: 'token', value: fullText }]);
              }
            } catch {
              // ignore
            }
          }
        });
      }
      if (!doneReceived) {
        setChatEvents(evts => [...evts, { type: 'done', value: '[DONE]' }]);
      }
    } catch (err) {
      setChatEvents(evts => [...evts, { type: 'error', value: String(err) }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, Arial, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
        padding: 32,
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <h2 style={{ textAlign: 'center', margin: 0, color: '#2d3748', letterSpacing: 1 }}>Simple SSE Chat</h2>
        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type a message..."
            disabled={chatLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 16,
              outline: 'none',
              background: chatLoading ? '#f1f5f9' : '#fff',
              color: '#222',
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: chatLoading ? '#cbd5e1' : '#2563eb',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              cursor: chatLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {chatLoading ? '...' : 'Send'}
          </button>
        </form>
        <div style={{
          minHeight: 40,
          background: '#f8fafc',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 15,
          color: '#222',
          marginBottom: 8,
          border: '1px solid #e2e8f0',
        }}>
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {chatEvents.length === 0 && <li style={{ color: '#888' }}>No messages yet.</li>}
            {chatEvents.map((evt, idx) => (
              <li key={idx} style={{
                color:
                  evt.type === 'status' ? '#2563eb'
                  : evt.type === 'error' ? '#dc2626'
                  : evt.type === 'done' ? '#059669'
                  : '#222',
                fontStyle: evt.type === 'status' ? 'italic' : 'normal',
                fontWeight: evt.type === 'token' ? 600 : 400,
                letterSpacing: 0.2,
              }}>
                {evt.type === 'status' ? `🛈 ${evt.value}`
                  : evt.type === 'token' ? evt.value
                  : evt.type === 'done' ? '✔️ Done'
                  : evt.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App
