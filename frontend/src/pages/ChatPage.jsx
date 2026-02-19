import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, Mountain, Car, Map } from 'lucide-react';
import Navigation from '../components/Navigation';
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
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Suggested prompts
  const suggestedPrompts = [
    { icon: Mountain, text: "Plan a 7-day trek to Everest Base Camp" },
    { icon: Car, text: "Show me NATTA-approved vehicles for 6 people" },
    { icon: Map, text: "Best time to visit Annapurna Circuit" },
  ];

  // Handle sending message
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        sender: 'ai',
        text: generateMockResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  // Mock response generator (replace with actual LLM API)
  const generateMockResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('trek') || lowerInput.includes('everest') || lowerInput.includes('annapurna')) {
      return "I'd love to help you plan an amazing trek! 🏔️\n\nTo create the perfect itinerary, I need a few details:\n\n1. **How many days** do you have for the trek?\n2. **Difficulty level** - Are you an experienced trekker or beginner?\n3. **How many people** are in your group?\n4. **Preferred season** - When are you planning to go?\n\nOnce you share these details, I'll create a day-by-day itinerary with NATTA-approved vehicle recommendations for your journey!";
    }
    
    if (lowerInput.includes('vehicle') || lowerInput.includes('car') || lowerInput.includes('transport')) {
      return "Great! Let me show you NATTA-approved vehicles:\n\n🚗 **Car (1-3 passengers)** - NPR 1,200/day\nPerfect for: City tours, airport transfers\n\n🚙 **SUV (3-5 passengers)** - NPR 1,800/day\nPerfect for: Mountain roads, extra luggage\n\n🚐 **Hiace/Jeep (6-10 passengers)** - NPR 2,500/day\nPerfect for: Group travel, trekking trips\n\nWhich type interests you? I can provide specific vehicle options with vendor details!";
    }
    
    if (lowerInput.includes('time') || lowerInput.includes('season') || lowerInput.includes('when')) {
      return "**Best times to visit Nepal:**\n\n🌸 **Spring (March-May)**\n- Clear mountain views\n- Rhododendron blooms\n- Ideal for trekking\n\n🍂 **Autumn (Sep-Nov)**\n- Best visibility\n- Stable weather\n- Peak trekking season\n\n❄️ **Winter (Dec-Feb)** - Lower altitudes only\n☔ **Monsoon (Jun-Aug)** - Not recommended for trekking\n\nWhich season works for you? I'll tailor recommendations accordingly!";
    }
    
    return "I understand you're interested in exploring Nepal! I can help with:\n\n✅ Custom itinerary planning\n✅ NATTA-approved vehicle recommendations\n✅ Trek guidance and tips\n✅ Accommodation suggestions\n✅ Budget planning\n\nWhat specific aspect would you like to explore first?";
  };

  // Handle suggested prompt click
  const handleSuggestedPrompt = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  // Handle reset conversation
  const handleReset = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: "Namaste! 🙏 I'm your NepalTravel AI assistant. I can help you plan amazing trips across Nepal with NATTA-approved vehicles and personalized itineraries. How can I assist you today?",
          timestamp: new Date(),
        }
      ]);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-page">
      <Navigation />
      
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">
              <Sparkles className="avatar-icon" />
            </div>
            <div className="chat-header-info">
              <h1 className="chat-title">NepalTravel AI Assistant</h1>
              <p className="chat-status">
                <span className="status-dot"></span>
                Online
              </p>
            </div>
          </div>
          <button className="reset-button" onClick={handleReset} title="Clear conversation">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              {message.sender === 'ai' && (
                <div className="message-avatar">
                  <Sparkles size={20} />
                </div>
              )}
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              {message.sender === 'user' && (
                <div className="message-avatar user-avatar">
                  You
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="message ai-message typing-message">
              <div className="message-avatar">
                <Sparkles size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Prompts (show only if no messages yet) */}
          {messages.length === 1 && (
            <div className="suggested-prompts">
              <p className="prompts-label">Try asking:</p>
              <div className="prompts-grid">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="prompt-card"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                  >
                    <prompt.icon className="prompt-icon" />
                    <span className="prompt-text">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              className="message-input"
              placeholder="Ask about Nepal trips, vehicles, itineraries..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={isTyping}
            />
            <button 
              className="send-button" 
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="input-hint">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;