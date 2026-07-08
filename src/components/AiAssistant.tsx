import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';

interface AiAssistantProps {
  isArabic: boolean;
}

export default function AiAssistant({ isArabic }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: isArabic 
        ? 'مرحباً بك في بوتيك زيوكا الفاخر. أنا مستشارك الذكي لتنسيق المظهر واقتراح الهدايا. كيف يمكنني مساعدتك اليوم في اختيار القطعة المثالية؟' 
        : 'Welcome to ZEWKA Luxury Boutique. I am your premium shopping consultant. How may I assist you today in selecting the perfect piece?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ArabicPrompts = [
    'اقترح لي هدية زواج فاخرة',
    'ما هي مميزات معطف صوف الميرينو؟',
    'كيف أنسق حقيبة الكتف الجلدية؟',
    'حدثني عن عطر "نسيم زيوكا"'
  ];

  const EnglishPrompts = [
    'Suggest a luxury wedding gift',
    'What makes Merino wool overcoats special?',
    'How do I style the shoulder bag?',
    'Tell me about Naseem perfume'
  ];

  const prompts = isArabic ? ArabicPrompts : EnglishPrompts;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await response.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        throw new Error();
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: isArabic
            ? 'نعتذر بشدة، واجهت بوابة الاتصال مع المستشار الذكي عطلاً مؤقتاً. يرجى المحاولة بعد قليل.'
            : 'We sincerely apologize, the AI connection encountered a transient error. Please retry shortly.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="ai-assistant-widget">
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsOpen(true)}
            className="p-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white rounded-full shadow-2xl shadow-[#1d1d1c]/20 flex items-center justify-center cursor-pointer relative"
            id="ai-trigger-button"
          >
            <MessageSquare className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -left-1 w-3 h-3 bg-[#D97706] rounded-full border border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Chat Box Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="w-[90vw] sm:w-[24rem] h-[30rem] bg-[#FBFBFA] border border-[#EAEAE8] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            id="ai-chatbox-panel"
            style={{ direction: isArabic ? 'rtl' : 'ltr' }}
          >
            {/* Header */}
            <div className="p-4 bg-[#1D1D1C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#C5A880]/20 rounded-full border border-[#C5A880]/30">
                  <Sparkles className="w-4 h-4 text-[#C5A880] animate-spin" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#C5A880]">ZEWKA AI</h3>
                  <span className="text-[9px] text-[#8E8D8A] block">
                    {isArabic ? 'مستشارك الشخصي الفاخر' : 'Luxury Shopping Advisor'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none bg-[#F5F5F3]">
              {messages.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={index}
                    className={`flex gap-2 max-w-[85%] ${
                      isModel 
                        ? (isArabic ? 'mr-0 ml-auto' : 'ml-0 mr-auto') 
                        : (isArabic ? 'mr-auto ml-0 flex-row-reverse' : 'ml-auto mr-0 flex-row-reverse')
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border text-xs ${
                      isModel
                        ? 'bg-[#1D1D1C] text-[#C5A880] border-[#C5A880]/30'
                        : 'bg-white text-[#1D1D1C] border-[#EAEAE8]'
                    }`}>
                      {isModel ? <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble */}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                      isModel
                        ? 'bg-white border border-[#EAEAE8] text-[#1D1D1C] rounded-tr-none'
                        : 'bg-[#1D1D1C] text-white rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Streaming loading animation */}
              {isLoading && (
                <div className={`flex gap-2 max-w-[80%] ${isArabic ? 'mr-0' : 'ml-0'}`}>
                  <div className="w-7 h-7 rounded-full bg-[#1D1D1C] text-[#C5A880] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-3 bg-white border border-[#EAEAE8] rounded-2xl rounded-tr-none flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Pills */}
            <div className="p-3 border-t border-[#EAEAE8] bg-white flex gap-1.5 overflow-x-auto scrollbar-none">
              {prompts.map((p, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(p)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-[#F5F5F3] hover:bg-[#C5A880]/10 hover:text-[#A88C5E] border border-transparent hover:border-[#C5A880]/20 text-[10px] font-medium rounded-full whitespace-nowrap transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Form Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-white border-t border-[#EAEAE8] flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isArabic ? 'اسأل مستشارك الفاخر...' : 'Ask your shopping concierge...'}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-[#1D1D1C] hover:bg-[#C5A880] disabled:bg-[#EAEAE8] text-white rounded-full transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
