import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, Mountain, Car, Map } from 'lucide-react';
import Navigation from '../components/Navigation';
import axios from 'axios';
import './ChatPage.css';

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

  // Scroll to bottom on new message
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 1. Real backend API request
  const sendMessage = async (userText) => {
    try {
      const res = await axios.post('http://localhost:8000/api/chat/', {
        message: userText
      });
      return res.data; // { response, sources, ... }
    } catch (err) {
      return {
        response: "Failed to contact backend. Please check your connection.",
        sources: [],
        mode: "error"
      };
    }
  };

  // 2. Handle sending user message and await AI response
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // CALL the backend
    const aiResult = await sendMessage(inputValue);
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        sender: 'ai',
        text: aiResult.response,
        timestamp: new Date(),
        sources: aiResult.sources,
        mode: aiResult.mode
      }
    ]);
    setIsTyping(false);
    setInputValue('');
  };

  // 3. Enter key support
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      {/* Chat Message List */}
      <div className="messages-list">
        {messages.map(msg =>
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-content">{msg.text}</div>
            {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
              <div className="message-sources">
                <small>Sources:</small>
                <ul>
                  {msg.sources.map((src, srcIdx) =>
                    <li key={srcIdx}>
                      {src.title} ({src.category}, relev: {src.relevance})
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* User Input */}
      <div className="input-section">
        <textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question and press Enter..."
        />
        <button onClick={handleSend} disabled={isTyping || !inputValue.trim()}>
          {isTyping ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatPage;