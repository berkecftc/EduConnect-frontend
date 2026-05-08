import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { sendStudentMessage, sendInstructorMessage } from '../api/aiService';

const AIChatAssistant = ({ assistantType = 'student' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const getAssistantConfig = () => {
    switch (assistantType) {
      case 'instructor':
        return {
          title: 'Akademisyen Asistanı',
          description: 'Syllabus oluşturma, ders planlama ve değerlendirme soruları için yardımcı',
          apiCall: sendInstructorMessage,
          themeClasses: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
          botColor: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
        };
      case 'student':
      default:
        return {
          title: 'Öğrenci Asistanı',
          description: 'Ders seçimi, ödev planlama, kampüs rehberliği ve kulüp tavsiyeleri için yardımcı',
          apiCall: sendStudentMessage,
          themeClasses: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
          botColor: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
        };
    }
  };

  const config = getAssistantConfig();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setIsLoading(true);

    try {
      const response = await config.apiCall(userMessage);
      const reply = response.reply || 'Cevap alınamadı.';
      setMessages((prev) => [...prev, { text: reply, sender: 'bot' }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Üzgünüm, bir hata oluştu veya bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.', sender: 'bot', isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Sohbet geçmişini silmek istediğinize emin misiniz?')) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.themeClasses}`}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-200">{config.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{config.description}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Sohbeti Temizle"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4">
            <Bot className="w-12 h-12 opacity-50" />
            <p className="text-sm text-center max-w-sm">
              Merhaba! Size nasıl yardımcı olabilirim? {config.description}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                  msg.sender === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                    : config.botColor
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-tl-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex gap-3 max-w-[85%]">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${config.botColor}`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-500">Düşünüyor... Bu işlem biraz zaman alabilir (10 dakikaya kadar).</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesajınızı yazın..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50 disabled:opacity-50 transition-colors dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatAssistant;
