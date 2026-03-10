import React, { useState, useRef, useEffect } from 'react';
import { Send, Mountain, Sparkles } from 'lucide-react';
import Navigation from '../components/Navigation';
import axios from 'axios';
import './ChatPage.css';

const SUGGESTIONS = [
  "Plan a 7-day Everest Base Camp trek",
  "Best vehicles for Annapurna Circuit",
  "What's the best time to visit Pokhara?",
  "NATTA-approved transport from Kathmandu",
];

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Namaste! 🙏 I'm your NepalTravel AI assistant. I can help you plan amazing trips across Nepal with NATTA-approved vehicles and personalized itineraries. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (userText) => {
    try {
      const res = await axios.post('http://localhost:8000/api/chat/', { message: userText });
      return res.data;
    } catch (err) {
      return {
        response: "Failed to contact backend. Please check your connection.",
        sources: [],
        mode: "error"
      };
    }
  };

  const handleSend = async (text) => {
    const msgText = text || inputValue;
    if (!msgText.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: msgText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const aiResult = await sendMessage(msgText);

    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResult.response,
        timestamp: new Date(),
        sources: aiResult.sources,
        mode: aiResult.mode,
      }
    ]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className="chat-page">
      <Navigation />

      <div className="chat-wrapper">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">
              <Mountain size={20} />
            </div>
            <div>
              <h2 className="chat-title">NepalTravel AI</h2>
              <span className="chat-status">
                <span className="status-dot" />
                Online — powered by Llama 3.2
              </span>
            </div>
          </div>
          <button
            className="new-chat-btn"
            onClick={() => setMessages([{
              id: 1, sender: 'ai',
              text: "Namaste! 🙏 I'm your NepalTravel AI assistant. How can I assist you today?",
              timestamp: new Date(),
            }])}
          >
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="messages-list">

          {/* Suggestion chips — only on fresh chat */}
          {showSuggestions && (
            <div className="suggestions-wrap">
              <p className="suggestions-label">
                <Sparkles size={14} /> Try asking...
              </p>
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender}`}>

              {msg.sender === 'ai' && (
                <div className="msg-avatar ai-avatar">
                  <Mountain size={14} />
                </div>
              )}

              <div className="msg-body">
                <div className="msg-bubble">
                  {msg.text}
                </div>

                {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                  <div className="msg-sources">
                    <span className="sources-label">Sources</span>
                    {msg.sources.map((src, i) => (
                      <span key={i} className="source-tag">
                        {src.title}
                      </span>
                    ))}
                  </div>
                )}

                <span className="msg-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="msg-avatar user-avatar">
                  U
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message ai">
              <div className="msg-avatar ai-avatar">
                <Mountain size={14} />
              </div>
              <div className="msg-body">
                <div className="msg-bubble typing-bubble">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-section">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Nepal travel, treks, vehicles..."
              rows={1}
              disabled={isTyping}
            />
            <button
              className="send-btn"
              onClick={() => handleSend()}
              disabled={isTyping || !inputValue.trim()}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </div>
  );
};

export default ChatPage;