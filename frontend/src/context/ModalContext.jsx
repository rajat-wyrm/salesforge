// src/context/ModalContext.jsx
import { createContext, useContext, useState } from "react";

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [selectedModal, setSelectedModal] = useState(null);

  return (
    <ModalContext.Provider value={{ selectedModal, setSelectedModal }}>
      {children}
    </ModalContext.Provider>
  );
}

// Custom hook for clean imports
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}