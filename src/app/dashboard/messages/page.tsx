"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { getToken, User } from "@/lib/api";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { MessageSquare, Users } from "lucide-react";
import { useRole } from "@/components/RoleContext";

export default function MessagesPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const [contacts, setContacts] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchContacts = async () => {
      try {
        const token = getToken();
        // Determine endpoint based on role
        const endpoint = role === "consultant" 
          ? "http://localhost:8000/api/v1/consultant/clients" 
          : "http://localhost:8000/api/v1/client/consultants";
          
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
          if (data.length > 0) {
            setActiveContact(data[0]); // auto-select first contact
          }
        }
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [user, role]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading contacts...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-bubble-sm bg-primary/10 flex items-center justify-center text-primary">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">Private direct messaging</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Contacts Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <BubbleCard className="p-4 bg-surface/50 border-border">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Users size={16} />
              {role === "consultant" ? "Your Clients" : "Your Consultants"}
            </h3>
            
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts available.</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full text-left px-4 py-3 rounded-bubble-sm transition-all flex items-center gap-3 ${
                      activeContact?.id === contact.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-background border border-transparent hover:border-border text-foreground"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      activeContact?.id === contact.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    }`}>
                      {contact.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium truncate">{contact.username}</span>
                  </button>
                ))}
              </div>
            )}
          </BubbleCard>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-3">
          {activeContact ? (
            <ChatInterface otherUserId={activeContact.id} otherUserName={activeContact.username} />
          ) : (
            <BubbleCard className="h-full flex flex-col items-center justify-center text-muted-foreground bg-surface/50 border-dashed border-2">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a contact to start messaging</p>
            </BubbleCard>
          )}
        </div>
      </div>
    </div>
  );
}
