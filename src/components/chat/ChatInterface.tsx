"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { getToken } from "@/lib/api";
import { BubbleButton } from "../ui/BubbleButton";
import { BubbleCard } from "../ui/BubbleCard";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: int;
  sender_id: int;
  receiver_id: int;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function ChatInterface({ otherUserId, otherUserName }: { otherUserId: number; otherUserName: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !otherUserId) return;

    // Fetch initial history
    const fetchHistory = async () => {
      try {
        const token = getToken();
        const res = await fetch(`http://localhost:8000/api/v1/messages/history/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    };

    fetchHistory();

    // Establish WebSocket connection
    const token = getToken();
    const wsUrl = `ws://localhost:8000/api/v1/messages/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        // Only append if it's relevant to the current chat
        if (
          (newMessage.sender_id === otherUserId && newMessage.receiver_id === user.id) ||
          (newMessage.sender_id === user.id && newMessage.receiver_id === otherUserId)
        ) {
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [user, otherUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const token = getToken();
    const messagePayload = {
      content: input,
      receiver_id: otherUserId
    };

    setInput(""); // Optimistic clear

    try {
      await fetch("http://localhost:8000/api/v1/messages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(messagePayload)
      });
      // The WebSocket will broadcast the message back to us, 
      // so we don't need to manually append it to the state here.
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BubbleCard className="flex flex-col h-[600px] max-h-[80vh] border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{otherUserName}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              {isConnected ? "Live Chat Active" : "Connecting..."}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] p-3 px-4 rounded-2xl ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-surface border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  <p className="text-[0.95rem] leading-relaxed">{msg.content}</p>
                  <div className={`text-[0.65rem] mt-1 text-right ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-border">
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-background border border-border rounded-bubble-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-14"
          />
          <BubbleButton
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1 top-1 bottom-1 px-4 h-auto rounded-md"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4" />
          </BubbleButton>
        </form>
      </div>
    </BubbleCard>
  );
}
