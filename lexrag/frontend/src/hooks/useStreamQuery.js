import { useState, useCallback, useRef } from 'react';
import { streamQuery } from '../api/client';

export function useStreamQuery(token) {
  const [messages,    setMessages]    = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef  = useRef(false);
  const streamingIdRef  = useRef(null);
  const accumulatedRef  = useRef('');

  const send = useCallback((query) => {
    if (!query.trim() || isStreamingRef.current) return;
    isStreamingRef.current = true;
    setIsStreaming(true);

    const userMsg = {
      id:        `user-${Date.now()}`,
      role:      'user',
      content:   query,
      citations: null,
      cached:    null,
      timestamp: new Date(),
    };

    const streamingId = `stream-${Date.now()}`;
    streamingIdRef.current = streamingId;
    accumulatedRef.current = '';

    const placeholder = {
      id:        streamingId,
      role:      'assistant',
      content:   '',
      citations: null,
      cached:    null,
      streaming: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, placeholder]);

    streamQuery({
      query,
      token,
      onToken: (content) => {
        accumulatedRef.current += content;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: accumulatedRef.current }
              : m
          )
        );
      },
      onCitations: (citations, cached) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, id: `assistant-${Date.now()}`, content: accumulatedRef.current, citations, cached, streaming: false }
              : m
          )
        );
      },
      onDone: () => {
        isStreamingRef.current = false;
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
        );
      },
      onError: (err) => {
        isStreamingRef.current = false;
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: `Error: ${err.message}`, streaming: false, error: true }
              : m
          )
        );
      },
    });
  }, [token]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { send, isStreaming, messages, clearMessages };
}
