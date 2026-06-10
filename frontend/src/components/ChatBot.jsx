import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Bot } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ChatBot() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

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

    // 4. AUTO-RESET / WELCOME MESSAGE
    useEffect(() => {
        // Skip if hidden
        if (isHidden) return;

        let welcomeMsg = "Hello! I can provide insights on Global System stats.";

        if (isLandingContext) {
            welcomeMsg = "Hi, I'm your Fintech assistant. What do you want to do right now: find new leads or manage existing ones?";
        } else if (isUserContext) {
            welcomeMsg = "Hello! Ask me about your personal logins and activity.";
        } else if (location.pathname.includes('admin')) {
            welcomeMsg = "Hello Admin! Ask me about system-wide performance and metrics.";
        }

        setMessages([{ text: welcomeMsg, sender: "bot" }]);
    }, [location.pathname, isUserContext, isLandingContext, isHidden]);

    // 5. EARLY RETURN - AFTER all hooks are called
    if (isHidden) {
        return null;
    }

    // 4. SEND MESSAGE LOGIC
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
        setInput("");
        setLoading(true);

        try {
            // Retrieve User ID to send context
            const userId = localStorage.getItem("userId");

            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    context: context,
                    userId: userId // Pass dynamic ID
                }),
            });

            const data = await response.json();
            setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { text: "Sorry, I can't reach the server right now.", sender: "bot" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col border border-gray-100">

                    {/* Header */}
                    <div className="bg-[#2DD4BF] h-32 relative flex justify-center items-center">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>

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
                    <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col gap-4">
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
                                    className={`p-3 text-sm leading-relaxed ${msg.sender === "user"
                                        ? "bg-[#2DD4BF] text-white rounded-2xl rounded-br-sm shadow-md"
                                        : "text-gray-800 font-medium"
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
                                <div className="bg-gray-100 text-gray-500 text-xs px-3 py-2 rounded-full animate-pulse">
                                    Typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Type here......."
                                className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent placeholder-gray-400 shadow-sm"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className="absolute right-2 p-2 text-black hover:text-[#2DD4BF] transition-colors disabled:opacity-50"
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
