import React, { useEffect, useRef, useState } from 'react';
import { FaComments, FaPaperPlane } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I’m Privacyx Guardian. How can I help you with your on-chain privacy today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [...newMessages],
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message;

      if (reply) {
        setMessages([...newMessages, reply]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: '⚠️ No response from the AI.' }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ Network error. Please try again.' }]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={toggleChat}
            className="bg-[#4befa0] text-black p-4 rounded-full shadow-xl"
          >
            <FaComments size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-[#111] border border-[#4befa0] rounded-xl shadow-2xl w-96 h-[500px] flex flex-col"
          >
            <div className="flex justify-between items-center bg-[#4befa0] text-black p-3 rounded-t-xl font-semibold">
              <span>Chat with Privacyx Guardian</span>
              <button onClick={toggleChat}>✖</button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-sm">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#1a1a1a] text-white' : 'bg-[#2a2a2a] text-[#4befa0]'}`}>
                      <div className="text-xs mb-1 font-semibold opacity-70">
                        {msg.role === 'user' ? 'You' : 'Privacyx Guardian'}
                      </div>
                      <div className="text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="p-2 rounded-xl bg-[#2a2a2a] text-[#4befa0] text-xs">
                      ✍️ Privacyx Guardian is typing...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-[#4befa0] flex items-center gap-2">
              <input
                type="text"
                className="flex-1 p-2 rounded-lg bg-black border border-[#4befa0] text-white text-sm focus:outline-none"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <button onClick={handleSend} disabled={loading} className="text-[#4befa0]">
                <FaPaperPlane />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;

