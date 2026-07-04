import { useState, useRef, useEffect } from "react";
import { X, Send, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import api from "../lib/api";

export default function ChatBot() {
    const location = useLocation();
    const { user } = useAuth();
    const { messages, setMessages, isOpen, setIsOpen, clearChat } = useChat();
    const { theme } = useTheme();
    const darkMode = theme === "dark";
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        console.log("[DEBUG] [ChatBot] Mounted. location:", location.pathname, "messages length:", messages.length);
        return () => console.log("[DEBUG] [ChatBot] UNMOUNTED!");
    }, []);

    // Log every render to track state validity across navigations
    useEffect(() => {
        console.log(`[DEBUG] [ChatBot] Render trace - Path: ${location.pathname}, UserID: ${user ? user.id : 'none'}, Messages: ${messages.length}, isOpen: ${isOpen}`);
    });

    // 1. VISIBILITY CHECK (Blocklist approach)
    // Hide Chatbot ONLY on login/register pages
    const hiddenPathnames = ['/login', '/signup', '/register', '/admin-login'];
    const isHidden = hiddenPathnames.includes(location.pathname);

    // 2. CONTEXT LOGIC - Compute BEFORE hooks that depend on it
    // Determine context based on current route
    const getContext = () => {
        if (location.pathname === '/') return 'landing';
        if (location.pathname.includes('my-dashboard') || location.pathname.includes('user-dashboard')) return 'user';
        return 'global';
    };
    const context = getContext();
    const isUserContext = context === 'user';
    const isLandingContext = context === 'landing';

    // Scroll Logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 3. ALL HOOKS MUST BE CALLED UNCONDITIONALLY (before any early returns)
    useEffect(() => {
        if (!isHidden) {
            scrollToBottom();
        }
    }, [messages, isOpen, isHidden]);

    // 5. EARLY RETURN - AFTER all hooks are called
    if (isHidden) {
        return null;
    }

    // 4. SEND MESSAGE LOGIC
    const handleSend = async () => {
        console.log("[DEBUG] [ChatBot] handleSend called! Input:", input);
        if (!input.trim()) {
            console.log("[DEBUG] [ChatBot] Input is empty, aborting handleSend.");
            return;
        }

        const userMessage = input;
        console.log("[DEBUG] [ChatBot] Setting user message in UI:", userMessage);
        setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
        setInput("");
        setLoading(true);

        try {
            const userId = user ? String(user.id) : null;
            const requestPayload = {
                message: userMessage,
                context: context,
                userId: userId
            };
            
            console.log("[DEBUG] [ChatBot] Sending request to /ai/chat with payload:", requestPayload);
            const response = await api.post("/ai/chat", requestPayload);
            
            console.log("[DEBUG] [ChatBot] Received response. Status:", response.status, "Body:", response.data);

            const botReply = response.data?.data?.reply || response.data?.reply || "I received a response, but it was empty.";
            
            console.log("[DEBUG] [ChatBot] Executing setMessages with botReply:", botReply);
            setMessages((prev) => {
                console.log("[DEBUG] [ChatBot] setMessages callback running. Prev length:", prev.length);
                return [...prev, { text: botReply, sender: "bot" }];
            });
        } catch (error) {
            console.error("[DEBUG] [ChatBot] Chat error occurred:", error);
            if (error.response) {
                console.error("[DEBUG] [ChatBot] Error Response Status:", error.response.status, "Data:", error.response.data);
            }
            setMessages((prev) => [
                ...prev,
                { text: "Sorry, I can't reach the server right now.", sender: "bot" },
            ]);
        } finally {
            console.log("[DEBUG] [ChatBot] handleSend finally block reached, setting loading to false.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className={`mb-4 w-80 md:w-96 h-[500px] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col border transition-colors duration-300 ${darkMode ? "border-gray-700 bg-slate-900" : "border-gray-100 bg-white"}`}>

                    {/* Header */}
                    <div className="bg-[#2DD4BF] h-32 relative flex justify-center items-center">
                        <div className="absolute top-4 right-4 flex gap-1">
                            <button
                                onClick={clearChat}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                                aria-label="New Chat"
                                title="New Chat"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                                aria-label="Close"
                                title="Close"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Logo Container (White Oval) */}
                        <div className="bg-white px-6 py-2 rounded-full shadow-sm">
                            <img
                                src="/uptoskills-logo.png"
                                alt="Uptoskills"
                                className="h-6 object-contain"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerText = 'UPTOSKILLS';
                                    e.target.parentNode.className = "bg-white px-6 py-2 rounded-full shadow-sm text-[#2DD4BF] font-bold text-lg tracking-wide";
                                }}
                            />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 transition-colors duration-300 ${darkMode ? "bg-slate-900" : "bg-white"}`}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 max-w-[90%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                                    }`}
                            >
                                {/* Bot Icon for Bot Messages */}
                                {msg.sender === "bot" && (
                                    <div className="w-8 h-8 shrink-0">
                                        <img src="/robot.png" alt="Bot" className="w-full h-full object-contain" />
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                    className={`p-3 text-sm leading-relaxed rounded-2xl ${msg.sender === "user"
                                        ? "bg-[#2DD4BF] text-white rounded-br-sm shadow-md"
                                        : `${darkMode ? "bg-slate-800 text-slate-100" : "bg-gray-100 text-gray-800"} font-medium`
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 self-start">
                                <div className="w-8 h-8 shrink-0">
                                    <img src="/robot.png" alt="Bot" className="w-full h-full object-contain opacity-50" />
                                </div>
                                <div className={`text-xs px-3 py-2 rounded-full animate-pulse ${darkMode ? "bg-slate-800 text-slate-300" : "bg-gray-100 text-gray-500"}`}>
                                    Typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-4 transition-colors duration-300 ${darkMode ? "bg-slate-900" : "bg-white"}`}>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Type here......."
                                className={`w-full pl-4 pr-12 py-3 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent transition-colors duration-300 ${darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className={`absolute right-2 p-2 transition-colors disabled:opacity-50 ${darkMode ? "text-slate-200 hover:text-[#2DD4BF]" : "text-black hover:text-[#2DD4BF]"}`}
                            >
                                <Send className="w-5 h-5 fill-current" />
                            </button>
                        </div>
                        {/* Bottom Bar Indicator (iOS style) */}
                        <div className="flex justify-center mt-4">
                            <div className="w-1/3 h-1.5 bg-[#2DD4BF] rounded-full opacity-80"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative w-20 h-20 transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                    title="Ask AI"
                >
                    <img
                        src="/robot.png"
                        alt="Ask AI"
                        className="w-full h-full object-contain drop-shadow-xl"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div class="w-16 h-16 bg-[#2DD4BF] rounded-full shadow-xl flex items-center justify-center"><svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>';
                        }}
                    />
                </button>
            )}
        </div>
    );
}
