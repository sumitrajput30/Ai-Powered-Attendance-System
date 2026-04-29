import React, { useState } from 'react';
import api from '../api';
import { useSelector } from 'react-redux';
import { Send, Bot, User } from 'lucide-react';

const AIAssistant = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = useSelector(state => state.auth.token);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { text: query, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/ask', 
        { query: userMsg.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { text: res.data.response, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Error connecting to AI. Please try again or check your permissions.', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot size={24} color="var(--primary-color)" /> AI HR Assistant
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ask me about attendance, latecomers, or overtime queries.</p>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
            No messages yet. Ask something like "Who came late today?"
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            gap: '0.5rem'
          }}>
             {msg.sender === 'bot' && <Bot size={20} color="var(--primary-color)" style={{ marginTop: '0.2rem' }}/>}
            <div style={{
              maxWidth: '70%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--panel-bg)',
              color: 'white',
              border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {msg.text}
            </div>
             {msg.sender === 'user' && <User size={20} color="var(--text-muted)" style={{ marginTop: '0.2rem' }}/>}
          </div>
        ))}
        {loading && (
           <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.5rem' }}>
             <Bot size={20} color="var(--primary-color)" style={{ marginTop: '0.2rem' }}/>
             <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
               Thinking...
             </div>
           </div>
        )}
      </div>

      <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          className="input-field" 
          style={{ flex: 1, marginBottom: 0 }}
          placeholder="Type your question..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn" disabled={loading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
