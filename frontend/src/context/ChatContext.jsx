import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ChatContext = createContext(null);

const getWelcomeMessage = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '/landing') {
        return "Hi, I'm your Fintech assistant. What do you want to do right now: find new leads or manage existing ones?";
    }
    if (path.includes('admin')) {
        return "Hello Admin! Ask me about system-wide performance and metrics.";
    }
    if (path.includes('dashboard') || path.includes('my-dashboard') || path.includes('user-dashboard')) {
        return "Hello! Ask me about your personal logins and activity.";
    }
    return "Hello! I can provide insights on Global System stats.";
};

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("chatHistory");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.length > 0) return parsed;
            }
            return [{ text: getWelcomeMessage(), sender: "bot" }];
        } catch {
            return [{ text: "Hello! I can provide insights on Global System stats.", sender: "bot" }];
        }
    });

    const [isOpen, setIsOpen] = useState(() => {
        try {
            return localStorage.getItem("chatIsOpen") === "true";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        localStorage.setItem("chatHistory", JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem("chatIsOpen", String(isOpen));
    }, [isOpen]);

    const clearChat = useCallback(() => {
        setMessages([{ text: getWelcomeMessage(), sender: "bot" }]);
        localStorage.removeItem("chatHistory");
    }, []);

    return (
        <ChatContext.Provider value={{ messages, setMessages, isOpen, setIsOpen, clearChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
