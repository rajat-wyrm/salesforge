import React, { createContext, useContext, useState, useEffect } from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("chatHistory");
            console.log("[DEBUG] [ChatContext] Reading chatHistory from localStorage. Found:", saved);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.length > 0) return parsed;
            }

            // Generate contextual welcome message based on current path
            const path = window.location.pathname;
            let welcomeMsg = "Hello! I can provide insights on Global System stats.";
            if (path === '/' || path === '/landing') {
                welcomeMsg = "Hi, I'm your Fintech assistant. What do you want to do right now: find new leads or manage existing ones?";
            } else if (path.includes('admin')) {
                welcomeMsg = "Hello Admin! Ask me about system-wide performance and metrics.";
            } else {
                welcomeMsg = "Hello! Ask me about your personal logins and activity.";
            }

            return [{ text: welcomeMsg, sender: "bot" }];
        } catch (e) {
            console.error("[DEBUG] [ChatContext] Error reading chatHistory:", e);
            return [{ text: "Hello! I can provide insights on Global System stats.", sender: "bot" }];
        }
    });

    const [isOpen, setIsOpen] = useState(() => {
        try {
            const saved = localStorage.getItem("chatIsOpen");
            console.log("[DEBUG] [ChatContext] Reading chatIsOpen from localStorage. Found:", saved);
            return saved === "true";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        console.log("[DEBUG] [ChatContext] Mounted. Initial messages length:", messages.length);
        return () => console.log("[DEBUG] [ChatContext] UNMOUNTED!");
    }, []);

    useEffect(() => {
        console.log("[DEBUG] [ChatContext] Saving messages to localStorage:", messages);
        localStorage.setItem("chatHistory", JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem("chatIsOpen", String(isOpen));
    }, [isOpen]);

    const clearChat = () => {
        console.log("[DEBUG] [ChatContext] clearChat called! Setting messages to [] and clearing localStorage.");
        setMessages([]);
        localStorage.removeItem("chatHistory");
    };

    return (
        <ChatContext.Provider value={{ messages, setMessages, isOpen, setIsOpen, clearChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
