"use client";

import { useState, useCallback } from "react";

/**
 * @typedef {Object} ChatState
 * @property {boolean} isConversationStarted
 * @property {number} messageCount
 * @property {boolean} isCompactMode
 */

/**
 * @returns {ChatState & {startConversation: () => void, incrementMessageCount: () => void, clearConversation: () => void, toggleCompactMode: () => void}}
 */
export function useChatState() {
  const [state, setState] = useState({
    isConversationStarted: false,
    messageCount: 0,
    isCompactMode: false,
  });

  const startConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConversationStarted: true,
      isCompactMode: true,
    }));
  }, []);

  const incrementMessageCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      messageCount: prev.messageCount + 1,
    }));
  }, []);

  const clearConversation = useCallback(() => {
    setState({
      isConversationStarted: false,
      messageCount: 0,
      isCompactMode: false,
    });
  }, []);

  const toggleCompactMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCompactMode: !prev.isCompactMode,
    }));
  }, []);

  return {
    ...state,
    startConversation,
    incrementMessageCount,
    clearConversation,
    toggleCompactMode,
  };
}

