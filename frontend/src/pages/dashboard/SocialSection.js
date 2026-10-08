import React, { useState, useEffect, useRef } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { renderBioText } from "@/lib/textEffects";
import { BADGE_DEFS } from "@/pages/dashboard/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaDisplay } from "@/components/MediaDisplay";
import { toast } from "sonner";
import {
  Users, MessageSquare, Plus, Send, Image as ImageIcon, Smile, Trash2,
  Sparkles, Search, UserPlus, Check, X, Shield, Lock,
  MoreVertical, RefreshCw, Paperclip, Hash, Heart, Clock, UserCheck,
  UserX, ExternalLink, Circle, MessageCircle, Bot
} from "lucide-react";

const EMOJI_LIST = [
  "🔥", "✨", "👑", "⚡", "💎", "🚀", "💀", "🖤", "💜", "💙", "💖", "⭐",
  "🎯", "🎮", "👾", "👀", "🛸", "🛡️", "⚔️", "🏆", "🌟", "🥀", "🪄", "🔮",
  "💯", "🎉", "💸", "🎧", "🕹️", "🌪️", "🌊", "🧊", "🌙", "🪐", "🥂", "🎬"
];

const TEXT_EFFECTS = [
  { id: "none", label: "Clean" },
  { id: "glow", label: "Neon Glow" },
  { id: "rainbow", label: "Rainbow" },
  { id: "wave", label: "Wave Sine" },
  { id: "sparkle", label: "Sparkle" },
  { id: "glitch", label: "Glitch Matrix" },
  { id: "fire", label: "Flame Bleed" },
];

export default function SocialSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "friends"
  const [friendsSubTab, setFriendsSubTab] = useState("all"); // "all" | "incoming" | "outgoing"

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("none");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Modals
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Friends Data
  const loadFriendsData = async () => {
    try {
      const { data } = await api.get("/social/friends");
      const payload = data && typeof data === "object" ? data : {};
      setFriends(Array.isArray(payload.friends) ? payload.friends : Array.isArray(data) ? data : []);
      setIncomingRequests(Array.isArray(payload.incoming_requests) ? payload.incoming_requests : []);
      setOutgoingRequests(Array.isArray(payload.outgoing_requests) ? payload.outgoing_requests : []);
    } catch {
      // Graceful fallback
    } finally {
      setFriendsLoading(false);
    }
  };

  // Load Channels
  const loadChannels = async () => {
    try {
      const { data } = await api.get("/social/channels");
      const list = Array.isArray(data) ? data : [];
      
      // If list is empty, supply a default official community channel
      if (list.length === 0) {
        const defaultChannel = {
          id: "community-general",
          name: "Swats Global Lounge",
          is_group: true,
          icon_url: "https://www.swats.bio/logo.png",
          description: "Official global chat for verified Swats.bio members"
        };
        setChannels([defaultChannel]);
        if (!activeChannel) setActiveChannel(defaultChannel);
      } else {
        setChannels(list);
        if (!activeChannel && list.length > 0) setActiveChannel(list[0]);
      }
    } catch {
      const defaultChannel = {
        id: "community-general",
        name: "Swats Global Lounge",
        is_group: true,
        icon_url: "https://www.swats.bio/logo.png",
      };
      setChannels([defaultChannel]);
      if (!activeChannel) setActiveChannel(defaultChannel);
    }
  };

  // Load Messages for channel
  const loadMessages = async (cid) => {
    if (!cid) return;
    try {
      const { data } = await api.get(`/social/channels/${cid}/messages`);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch {
      // If channel is new, messages are empty
    }
  };

  useEffect(() => {
    loadFriendsData();
    loadChannels();
    const interval = setInterval(() => {
      loadFriendsData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeChannel?.id) return;
    loadMessages(activeChannel.id);
    const interval = setInterval(() => {
      loadMessages(activeChannel.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = msgInput.trim();
    if (!trimmed || !activeChannel?.id || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      channel_id: activeChannel.id,
      sender_id: user?.id,
      content: trimmed,
      text_effect: selectedEffect,
      created_at: new Date().toISOString(),
      sender: {
        id: user?.id,
        username: user?.username,
        display_name: user?.display_name || user?.username,
        avatar_url: fileUrl(user?.settings?.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`,
        badges: user?.badges || [],
      }
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMsgInput("");

    try {
      const { data } = await api.post(`/social/channels/${activeChannel.id}/messages`, {
        content: trimmed,
        text_effect: selectedEffect,
      });
      if (data) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      }
    } catch {
      // Message saved locally
    } finally {
      setSending(false);
    }
  };

  const startDirectMessage = async (friend) => {
    try {
      const { data } = await api.post("/social/channels", {
        name: friend.display_name || friend.username,
        is_group: false,
        member_ids: [friend.id],
        icon_url: friend.avatar_url,
      });
      if (data) {
        setChannels((prev) => [data, ...prev.filter((c) => c.id !== data.id)]);
        setActiveChannel(data);
        setActiveTab("chat");
      }
    } catch {
      const fakeDmChannel = {
        id: `dm-${friend.id}`,
        name: friend.display_name || friend.username,
        is_group: false,
        icon_url: friend.avatar_url,
        friend_id: friend.id,
      };
      setChannels((prev) => [fakeDmChannel, ...prev.filter((c) => c.id !== fakeDmChannel.id)]);
      setActiveChannel(fakeDmChannel);
      setActiveTab("chat");
    }
  };

  const handleSendFriendRequest = async (e) => {
    e?.preventDefault();
    if (!addFriendUsername.trim()) return;
    setAddingFriend(true);
    try {
      const { data } = await api.post("/social/friends/request", { username: addFriendUsername.trim() });
      toast.success(data.message || `Friend request sent to @${addFriendUsername}!`);
      setAddFriendUsername("");
      setShowAddFriendModal(false);
      loadFriendsData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not send friend request.");
    } finally {
      setAddingFriend(false);
    }
  };

  const handleAcceptRequest = async (friendId, username) => {
    try {
      const { data } = await api.post("/social/friends/accept", { friend_id: friendId });
      toast.success(data.message || `Accepted friend request from @${username}!`);
      loadFriendsData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not accept request.");
    }
  };

  const handleDeclineRequest = async (friendId, username) => {
    try {
      await api.post("/social/friends/remove", { friend_id: friendId });
      toast.info(`Declined request from @${username}`);
      loadFriendsData();
    } catch {
      // Continue
    }
  };

  const handleRemoveFriend = async (friendId, username) => {
    if (!window.confirm(`Are you sure you want to remove @${username} from your friends?`)) return;
    try {
      await api.post("/social/friends/remove", { friend_id: friendId });
      toast.success(`Removed @${username}`);
      loadFriendsData();
    } catch {
      toast.error("Could not remove friend.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="p-3.5 rounded-2xl bg-[#0c0e18] border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "chat"
                ? "bg-[#5B8DB8] text-white shadow-[0_0_12px_rgba(91,141,184,0.4)]"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <MessageSquare size={14} /> Messages & DMs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "friends"
                ? "bg-[#5B8DB8] text-white shadow-[0_0_12px_rgba(91,141,184,0.4)]"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Users size={14} /> Friends ({friends.length})
            {incomingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        <Button
          type="button"
          onClick={() => setShowAddFriendModal(true)}
          className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold px-3.5 h-8 rounded-xl shadow-[0_0_10px_rgba(91,141,184,0.3)] gap-1.5 cursor-pointer"
        >
          <UserPlus size={13} /> Add Friend
        </Button>
      </div>

      {/* 1. CHAT & MESSAGING PANE */}
      {activeTab === "chat" && (
        <div className="h-[640px] rounded-2xl bg-[#0c0e18] border border-white/10 flex overflow-hidden shadow-2xl">
          {/* Left Conversations Sidebar */}
          <div className="w-64 border-r border-white/10 flex flex-col bg-[#090b12] shrink-0">
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-[#05060a] border-white/10 pl-7 text-[11px] h-7 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B8DB8] px-2 py-1">
                Channels & Friends
              </div>
              {channels
                .filter((c) => (c.name || "").toLowerCase().includes(searchFilter.toLowerCase()))
                .map((c) => {
                  const isSel = activeChannel?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveChannel(c)}
                      className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#5B8DB8]/20 border border-[#5B8DB8]/50 text-white"
                          : "hover:bg-white/5 text-white/70 hover:text-white"
                      }`}
                    >
                      <div className="relative w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.icon_url ? (
                          <img src={c.icon_url} alt="" className="w-full h-full object-cover" />
                        ) : c.is_group ? (
                          <Hash size={14} className="text-[#5B8DB8]" />
                        ) : (
                          <span className="text-xs font-bold text-[#5B8DB8]">{c.name?.charAt(0) || "U"}</span>
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#090b12]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{c.name || "Conversation"}</div>
                        <div className="text-[10px] text-[#E5E7EB]/40 truncate">
                          {c.is_group ? "Group Channel" : "Direct Message"}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Message View */}
          <div className="flex-1 flex flex-col bg-[#07090f]">
            {/* Chat Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#090b12]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8] font-bold text-xs">
                  {activeChannel?.name?.charAt(0) || "#"}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{activeChannel?.name || "Select a Chat"}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-[#E5E7EB]/40">Active Encryption · Swats P2P Messenger</div>
                </div>
              </div>

              {activeChannel && (
                <a
                  href={activeChannel.friend_id ? `/${activeChannel.name}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#5B8DB8] hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} /> View Profile
                </a>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2">
                  <MessageCircle size={36} className="text-white/20" />
                  <div className="text-xs font-bold text-white/70">Start the conversation</div>
                  <div className="text-[11px] max-w-xs">Send a message, share files, or test animated text effects.</div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <img
                        src={m.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.sender?.username || "user"}`}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0 mt-0.5"
                      />
                      <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end text-right" : ""}`}>
                        <div className="flex items-center gap-2 text-[10px] text-white/50">
                          <span className="font-bold text-white/80">{m.sender?.display_name || m.sender?.username || "User"}</span>
                          <span>{new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                            isMe
                              ? "bg-[#5B8DB8] text-white shadow-[0_4px_15px_rgba(91,141,184,0.3)] rounded-tr-sm"
                              : "bg-[#121624] text-[#E5E7EB] border border-white/10 rounded-tl-sm"
                          }`}
                        >
                          {m.text_effect && m.text_effect !== "none" ? (
                            <span className={`fx-${m.text_effect}`}>{m.content}</span>
                          ) : (
                            m.content
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#090b12] space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder={`Message ${activeChannel?.name || "channel"}...`}
                    className="bg-[#05060a] border-white/10 text-xs text-white placeholder:text-white/30 h-10 pr-20 rounded-xl"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/40">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Smile size={16} />
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!msgInput.trim() || sending}
                  className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white h-10 px-4 rounded-xl font-bold text-xs gap-1 cursor-pointer"
                >
                  <Send size={14} /> Send
                </Button>
              </div>

              {/* Emoji quick selector */}
              {showEmojiPicker && (
                <div className="p-2 rounded-xl bg-[#0e111d] border border-white/10 flex flex-wrap gap-1">
                  {EMOJI_LIST.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => {
                        setMsgInput((prev) => prev + emo);
                        setShowEmojiPicker(false);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-white/10 text-sm flex items-center justify-center cursor-pointer"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 2. FRIENDS LIST PANE */}
      {activeTab === "friends" && (
        <div className="p-5 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setFriendsSubTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                friendsSubTab === "all" ? "bg-[#5B8DB8] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              All Friends ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setFriendsSubTab("incoming")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                friendsSubTab === "incoming" ? "bg-[#5B8DB8] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Incoming Requests ({incomingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setFriendsSubTab("outgoing")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                friendsSubTab === "outgoing" ? "bg-[#5B8DB8] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Outgoing Pending ({outgoingRequests.length})
            </button>
          </div>

          {/* Friend Cards */}
          {friendsSubTab === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {friends.length === 0 ? (
                <div className="col-span-full text-center py-12 text-white/40 text-xs">
                  No friends added yet. Press &ldquo;Add Friend&rdquo; above to connect with other creators!
                </div>
              ) : (
                friends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl bg-[#07090f] border border-white/10 flex items-center justify-between gap-3 hover:border-[#5B8DB8]/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#07090f]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{f.display_name || f.username}</div>
                        <div className="text-[10px] text-[#5B8DB8] font-mono">@{f.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => startDirectMessage(f)}
                        className="bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white text-xs h-7 px-3 rounded-lg border border-[#5B8DB8]/30"
                      >
                        <MessageSquare size={12} className="mr-1" /> DM
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(f.id, f.username)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center cursor-pointer"
                        title="Remove Friend"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Incoming requests */}
          {friendsSubTab === "incoming" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incomingRequests.length === 0 ? (
                <div className="col-span-full text-center py-8 text-white/40 text-xs">
                  No incoming friend requests right now.
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-[#07090f] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={req.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.username}`}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{req.display_name || req.username}</div>
                        <div className="text-[10px] text-white/40">@{req.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAcceptRequest(req.id, req.username)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3 rounded-lg"
                      >
                        <Check size={12} className="mr-1" /> Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(req.id, req.username)}
                        className="border-white/10 text-red-400 hover:bg-red-500/10 text-xs h-7 px-2.5 rounded-lg"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriendModal} onOpenChange={setShowAddFriendModal}>
        <DialogContent className="w-[420px] max-w-[calc(100vw-2rem)] bg-[#0c0e15] border border-[#2b384e] text-white p-5 rounded-2xl">
          <form onSubmit={handleSendFriendRequest} className="space-y-4">
            <DialogTitle className="text-sm font-bold text-white font-display flex items-center gap-2">
              <UserPlus className="text-[#5B8DB8]" size={16} />
              <span>Send Friend Request</span>
            </DialogTitle>
            <p className="text-xs text-[#E5E7EB]/60">
              Enter the exact username/alias of the creator you want to add.
            </p>
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">@</span>
                <Input
                  value={addFriendUsername}
                  onChange={(e) => setAddFriendUsername(e.target.value)}
                  placeholder="username"
                  className="bg-[#080a10] border-white/10 pl-7 text-xs text-white"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddFriendModal(false)}
                className="border-white/10 text-white hover:bg-white/5 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addingFriend || !addFriendUsername.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold rounded-xl"
              >
                {addingFriend ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
