import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Sparkles, Search, Check, X, Shield, Lock, Pin,
  MoreVertical, RefreshCw, Paperclip, Hash, Heart, Clock,
  ExternalLink, Circle, MessageCircle, Crown, Copy,
  Flame, Film, ChevronDown, CheckCheck, Eye, MapPin, Calendar, AtSign, Globe
} from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    name: "Popular",
    emojis: ["🔥", "✨", "👑", "⚡", "💎", "🚀", "💀", "🖤", "💜", "💙", "💖", "⭐", "🎯", "🎮", "👾", "👀", "🛸", "🛡️", "⚔️", "🏆", "🌟", "🥀", "🪄", "🔮", "💯", "🎉", "💸", "🎧", "🕹️", "🌪️", "🌊", "🧊", "🌙", "🪐", "🥂", "🎬"]
  },
  {
    name: "Smileys & Faces",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "🫨", "😴", "🤤", "😪", "😮", "😯", "😲", "🥱", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🫣", "👺", "👻", "👽", "🤖", "💩"]
  },
  {
    name: "Gaming & Cyber",
    emojis: ["🎮", "🕹️", "👾", "🎲", "🎯", "🎪", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "⚔️", "🗡️", "🛡️", "🏹", "🪓", "💣", "🧨", "💥", "🔫", "🔮", "🧿", "🪄", "⚡", "✨", "🔥", "☄️", "🚀", "🛸", "🤖", "🦾", "🦿", "💻", "🖥️", "⌨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🪫", "🔌", "💡", "🔦", "🕯️"]
  },
  {
    name: "VIP & Symbols",
    emojis: ["👑", "💎", "⭐", "🌟", "✨", "💫", "⚡", "🔥", "💯", "💢", "💥", "💫", "💨", "🕊️", "🌹", "🥀", "🌺", "🌸", "🖤", "🩶", "🤍", "🤎", "💜", "💙", "🩵", "💚", "💛", "🧡", "❤️", "🩷", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🆔", "⚛️"]
  }
];

const CURATED_GIFS = [
  { id: "g1", category: "Hype & Fire", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", title: "Fire Flame" },
  { id: "g2", category: "Hype & Fire", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", title: "Let's Go" },
  { id: "g3", category: "Gaming", url: "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif", title: "Victory Royale" },
  { id: "g4", category: "Gaming", url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif", title: "Pixel Gaming" },
  { id: "g5", category: "Anime & Cyber", url: "https://media.giphy.com/media/4ilFRqgbzbx4c/giphy.gif", title: "Cyber City" },
  { id: "g6", category: "Anime & Cyber", url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif", title: "Anime Glitch" },
  { id: "g7", category: "Laugh & Memes", url: "https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif", title: "Cat Vibe" },
  { id: "g8", category: "Laugh & Memes", url: "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif", title: "LOL" },
  { id: "g9", category: "GG & Respect", url: "https://media.giphy.com/media/diUKszNTUghVe/giphy.gif", title: "Respect Salute" },
  { id: "g10", category: "GG & Respect", url: "https://media.giphy.com/media/pHb82xtBPfqEg/giphy.gif", title: "Epic Handshake" },
];

const TEXT_EFFECTS = [
  { id: "none", label: "Standard", icon: "Aa" },
  { id: "glow", label: "Neon Glow", icon: "✨" },
  { id: "rainbow", label: "Rainbow", icon: "🌈" },
  { id: "wave", label: "Waveform", icon: "🌊" },
  { id: "sparkle", label: "Sparkles", icon: "⭐" },
  { id: "glitch", label: "Glitch Matrix", icon: "👾" },
  { id: "fire", label: "Flame Aura", icon: "🔥" },
];

export default function SocialSection() {
  const { user } = useAuth();

  // Channels & Messages
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("none");
  const [sending, setSending] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null);

  // Members & Community Roster
  const [communityMembers, setCommunityMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearchFilter, setMemberSearchFilter] = useState("");
  const [showMembersDrawer, setShowMembersDrawer] = useState(true);
  const [viewProfileUser, setViewProfileUser] = useState(null);
  const [viewProfileLoading, setViewProfileLoading] = useState(false);

  // Start DM Modal
  const [showStartDmModal, setShowStartDmModal] = useState(false);
  const [dmTargetUsername, setDmTargetUsername] = useState("");
  const [startingDm, setStartingDm] = useState(false);

  // Popups
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGifCategory, setSelectedGifCategory] = useState("All");
  const [gifSearch, setGifSearch] = useState("");
  const [showFxPicker, setShowFxPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load Channels
  const loadChannels = async (keepActive = true) => {
    try {
      const { data } = await api.get("/social/channels");
      const list = Array.isArray(data) ? data : [];
      
      const defaultLounge = {
        id: "community-general",
        name: "Swats Global Lounge",
        is_group: true,
        icon_url: "https://www.swats.bio/logo.png",
        description: "Official lounge for all Swats.bio members"
      };

      const finalChannels = list.some(c => c.id === "community-general") ? list : [defaultLounge, ...list];
      setChannels(finalChannels);
      
      if (!activeChannel && finalChannels.length > 0) {
        setActiveChannel(finalChannels[0]);
      } else if (keepActive && activeChannel) {
        const updated = finalChannels.find(c => c.id === activeChannel.id);
        if (updated) setActiveChannel(updated);
      }
    } catch {
      const defaultLounge = {
        id: "community-general",
        name: "Swats Global Lounge",
        is_group: true,
        icon_url: "https://www.swats.bio/logo.png",
        description: "Official lounge for all Swats.bio members"
      };
      setChannels([defaultLounge]);
      if (!activeChannel) setActiveChannel(defaultLounge);
    }
  };

  // Load Messages
  const loadMessages = async (channelId) => {
    if (!channelId) return;
    try {
      const { data } = await api.get(`/social/channels/${channelId}/messages?limit=100`);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Ignored
    }
  };

  // Load Community Members
  const loadCommunityMembers = async () => {
    setMembersLoading(true);
    try {
      const { data } = await api.get("/community/members");
      setCommunityMembers(Array.isArray(data) ? data : []);
    } catch {
      setCommunityMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadChannels(false);
    loadCommunityMembers();
  }, []);

  // Channel switch
  useEffect(() => {
    if (activeChannel?.id) {
      loadMessages(activeChannel.id);
      // Setup auto-polling every 3.5 seconds
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        loadMessages(activeChannel.id);
      }, 3500);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChannel?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start Direct Message with User
  const handleStartDm = async (target) => {
    const targetUsername = typeof target === "string" ? target.trim().replace(/^@/, "") : target?.username;
    const targetUserId = typeof target === "object" ? target?.id : null;

    if (!targetUsername && !targetUserId) {
      toast.error("Please enter a username or select a member.");
      return;
    }

    setStartingDm(true);
    try {
      const { data } = await api.post("/social/dm", {
        target_user_id: targetUserId,
        username: targetUsername
      });

      if (data && data.id) {
        await loadChannels(true);
        setActiveChannel(data);
        setShowStartDmModal(false);
        setDmTargetUsername("");
        toast.success(`Direct message opened with @${data.name || targetUsername}!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not start direct message.");
    } finally {
      setStartingDm(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!activeChannel) return;
    const trimmed = msgInput.trim();
    if (!trimmed && !pendingMedia) return;

    setSending(true);
    try {
      const payload = {
        content: trimmed,
        media_url: pendingMedia?.url || null,
        media_type: pendingMedia?.type || null,
        text_effect: selectedEffect
      };

      const { data } = await api.post(`/social/channels/${activeChannel.id}/messages`, payload);
      setMessages(prev => [...prev, data]);
      setMsgInput("");
      setPendingMedia(null);
      setSelectedEffect("none");
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowFxPicker(false);
      scrollToBottom();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const { data } = await api.post(`/social/messages/${messageId}/react`, { emoji });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m));
    } catch {
      toast.error("Failed to add reaction.");
    }
  };

  // Toggle Pin
  const handleTogglePin = async (messageId) => {
    try {
      const { data } = await api.post(`/social/messages/${messageId}/pin`);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: data.pinned } : m));
      toast.success(data.pinned ? "Message pinned!" : "Message unpinned");
    } catch {
      toast.error("Failed to update pin.");
    }
  };

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/social/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message.");
    }
  };

  // Media Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      setPendingMedia({ url: data.url, type, name: file.name });
      toast.success("Media attached!");
    } catch {
      toast.error("Upload failed. File may exceed limit.");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // View Profile Modal
  const handleOpenProfileModal = async (member) => {
    setViewProfileUser(member);
    setViewProfileLoading(true);
    try {
      const { data } = await api.get(`/u/${member.username}`);
      setViewProfileUser(data);
    } catch {
      // Keep basic info
    } finally {
      setViewProfileLoading(false);
    }
  };

  // Filtered Channels & Members
  const filteredChannels = useMemo(() => {
    if (!channelSearch.trim()) return channels;
    const q = channelSearch.toLowerCase();
    return channels.filter(c => (c.name || "").toLowerCase().includes(q) || (c.id || "").toLowerCase().includes(q));
  }, [channels, channelSearch]);

  const filteredMembers = useMemo(() => {
    if (!memberSearchFilter.trim()) return communityMembers;
    const q = memberSearchFilter.toLowerCase();
    return communityMembers.filter(m => (m.username || "").toLowerCase().includes(q) || (m.display_name || "").toLowerCase().includes(q));
  }, [communityMembers, memberSearchFilter]);

  const pinnedMessages = useMemo(() => {
    return messages.filter(m => m.pinned);
  }, [messages]);

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col md:flex-row gap-3">
      {/* ────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: LOUNGE & DIRECT MESSAGES */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-[#0c0e18] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display leading-tight">Social & Messages</h2>
              <p className="text-[10px] text-[#E5E7EB]/50">Global Lounge & Direct Chats</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowStartDmModal(true)}
            className="h-7 px-2.5 rounded-lg bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
          >
            <Plus size={13} />
            <span>New DM</span>
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 pl-8 text-xs bg-[#08090d] border-white/10 rounded-xl text-white placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B8DB8]">
            Community
          </div>

          {/* Global Lounge */}
          {filteredChannels.filter(c => c.id === "community-general").map((c) => {
            const isActive = activeChannel?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChannel(c)}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 text-white shadow-md"
                    : "hover:bg-white/5 border border-transparent text-white/70 hover:text-white"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B8DB8] to-[#3a5d7c] flex items-center justify-center text-white font-bold shadow">
                    <Globe size={18} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c0e18]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate text-white">Swats Global Lounge</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">GLOBAL</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate">
                    {c.latest_message?.content || "Public hangout for all members"}
                  </p>
                </div>
              </button>
            );
          })}

          <div className="pt-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between">
            <span>Direct Messages</span>
            <span className="text-[9px] text-white/30">{filteredChannels.filter(c => c.id !== "community-general").length}</span>
          </div>

          {/* 1-on-1 Direct Messages */}
          {filteredChannels.filter(c => c.id !== "community-general").length === 0 ? (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-white/40">No active direct messages.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStartDmModal(true)}
                className="h-7 text-xs border-white/10 text-[#5B8DB8] hover:bg-white/5"
              >
                <AtSign size={12} className="mr-1" />
                Start a direct message
              </Button>
            </div>
          ) : (
            filteredChannels.filter(c => c.id !== "community-general").map((c) => {
              const isActive = activeChannel?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChannel(c)}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 text-white shadow-md"
                      : "hover:bg-white/5 border border-transparent text-white/70 hover:text-white"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={c.icon_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.name}`}
                      alt={c.name}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10 bg-[#08090d]"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0c0e18]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-white">{c.name || "User"}</span>
                      {c.latest_message && (
                        <span className="text-[9px] text-white/30">
                          {new Date(c.latest_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 truncate">
                      {c.latest_message?.content || "Started direct chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MAIN CHAT WINDOW */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#0c0e18] border border-white/10 rounded-2xl overflow-hidden shadow-xl min-w-0">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-white/10 bg-[#08090d]/60 backdrop-blur flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeChannel?.id === "community-general" ? (
              <div className="w-9 h-9 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
                <Globe size={18} />
              </div>
            ) : (
              <img
                src={activeChannel?.icon_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChannel?.name || "chat"}`}
                alt={activeChannel?.name || "chat"}
                className="w-9 h-9 rounded-xl object-cover border border-white/10"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white font-display truncate">
                  {activeChannel?.name || "Swats Global Lounge"}
                </h1>
                {activeChannel?.id === "community-general" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/40 truncate">
                {activeChannel?.id === "community-general"
                  ? `${communityMembers.length} community members connected`
                  : `Direct conversation with @${activeChannel?.name || "user"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMembersDrawer(!showMembersDrawer)}
              className={`h-8 px-2.5 rounded-xl text-xs border-white/10 cursor-pointer ${
                showMembersDrawer ? "bg-[#5B8DB8]/20 text-[#5B8DB8] border-[#5B8DB8]/30" : "text-white/60 hover:text-white"
              }`}
            >
              <Users size={14} className="mr-1" />
              <span>Roster</span>
            </Button>
          </div>
        </div>

        {/* Pinned Messages Banner */}
        {pinnedMessages.length > 0 && (
          <div className="px-4 py-2 bg-[#5B8DB8]/10 border-b border-[#5B8DB8]/20 flex items-center gap-2 text-xs text-[#5B8DB8]">
            <Pin size={13} className="flex-shrink-0" />
            <span className="font-semibold">{pinnedMessages.length} Pinned {pinnedMessages.length === 1 ? "Message" : "Messages"}:</span>
            <span className="truncate text-white/80">{pinnedMessages[pinnedMessages.length - 1].content}</span>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#5B8DB8]/10 border border-[#5B8DB8]/20 flex items-center justify-center text-[#5B8DB8]">
                <MessageSquare size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No messages yet</h3>
                <p className="text-xs text-white/40 max-w-sm">
                  Be the first to say something in {activeChannel?.name || "this channel"}!
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isOwn = m.sender_id === user?.id;
              const senderPfp = m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`;
              const reactions = m.reactions && typeof m.reactions === "object" ? m.reactions : {};

              return (
                <div
                  key={m.id}
                  className={`group flex items-start gap-3 transition-colors rounded-xl p-2 -mx-2 hover:bg-white/[0.02] ${
                    m.pinned ? "bg-[#5B8DB8]/5 border border-[#5B8DB8]/20" : ""
                  }`}
                >
                  {/* Sender Avatar */}
                  <button
                    type="button"
                    onClick={() => handleOpenProfileModal(m)}
                    className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                  >
                    <img
                      src={senderPfp}
                      alt={m.username}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10 bg-[#08090d]"
                    />
                  </button>

                  {/* Message Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenProfileModal(m)}
                        className="text-xs font-bold text-white hover:text-[#5B8DB8] transition-colors cursor-pointer"
                      >
                        {m.display_name || m.username}
                      </button>
                      <span className="text-[10px] text-white/30">@{m.username}</span>

                      {/* Badges */}
                      {Array.isArray(m.badges) && m.badges.slice(0, 3).map((b) => {
                        const def = BADGE_DEFS[b] || { label: b, color: "#5B8DB8" };
                        return (
                          <span
                            key={b}
                            className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${def.color}20`,
                              color: def.color,
                              border: `1px solid ${def.color}40`
                            }}
                          >
                            {def.label}
                          </span>
                        );
                      })}

                      {m.role === "admin" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                          STAFF
                        </span>
                      )}

                      <span className="text-[10px] text-white/30 ml-auto">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="mt-1 text-xs text-white/90 break-words leading-relaxed">
                      {m.text_effect && m.text_effect !== "none" ? (
                        <div className={`effect-${m.text_effect}`}>
                          {renderBioText(m.content)}
                        </div>
                      ) : (
                        renderBioText(m.content)
                      )}
                    </div>

                    {/* Media Display */}
                    {m.media_url && (
                      <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        {m.media_type === "video" ? (
                          <video src={fileUrl(m.media_url)} controls className="w-full max-h-64 object-contain" />
                        ) : (
                          <img src={fileUrl(m.media_url)} alt="Attached media" className="w-full max-h-64 object-contain" />
                        )}
                      </div>
                    )}

                    {/* Reaction Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {Object.entries(reactions).map(([emoji, uids]) => {
                        if (!Array.isArray(uids) || uids.length === 0) return null;
                        const hasReacted = uids.includes(user?.id);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(m.id, emoji)}
                            className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              hasReacted
                                ? "bg-[#5B8DB8]/30 border border-[#5B8DB8]/60 text-white font-bold"
                                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px]">{uids.length}</span>
                          </button>
                        );
                      })}

                      {/* Quick Reaction Adder */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {["🔥", "👑", "✨", "❤️", "💎"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(m.id, emoji)}
                            className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-xs transition-transform hover:scale-125 cursor-pointer"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(m.id)}
                          className={`w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-xs transition-colors cursor-pointer ${
                            m.pinned ? "text-[#5B8DB8]" : "text-white/40 hover:text-white"
                          }`}
                          title="Pin message"
                        >
                          <Pin size={12} />
                        </button>
                        {(isOwn || user?.role === "admin") && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="w-6 h-6 rounded-md hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Delete message"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Media Preview Attachment */}
        {pendingMedia && (
          <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white">
              <Paperclip size={13} className="text-[#5B8DB8]" />
              <span className="font-semibold">Attached:</span>
              <span className="text-white/60 truncate max-w-xs">{pendingMedia.name || pendingMedia.url}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPendingMedia(null)}
              className="h-6 w-6 p-0 text-white/50 hover:text-white"
            >
              <X size={13} />
            </Button>
          </div>
        )}

        {/* Text Effect Bar */}
        {selectedEffect !== "none" && (
          <div className="px-4 py-1.5 bg-[#5B8DB8]/10 border-t border-[#5B8DB8]/20 flex items-center justify-between text-xs text-[#5B8DB8]">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={12} />
              <span>Effect Active: {TEXT_EFFECTS.find(e => e.id === selectedEffect)?.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEffect("none")}
              className="text-xs text-white/50 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Message Composer */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#08090d]/80 backdrop-blur space-y-2">
          <div className="relative flex items-center gap-2">
            {/* Action Tools */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                title="Upload image or video"
              >
                <ImageIcon size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showEmojiPicker ? "bg-[#5B8DB8] text-white" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                }`}
                title="Emoji palette"
              >
                <Smile size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showGifPicker ? "bg-[#5B8DB8] text-white" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                }`}
                title="GIF picker"
              >
                <Film size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowFxPicker(!showFxPicker)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showFxPicker || selectedEffect !== "none" ? "bg-[#5B8DB8] text-white" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                }`}
                title="Text effects"
              >
                <Sparkles size={15} />
              </button>
            </div>

            {/* Input Field */}
            <div className="flex-1 relative">
              <Input
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder={`Message ${activeChannel?.name || "Global Lounge"}...`}
                className="h-10 pl-3 pr-10 text-xs bg-[#0c0e18] border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#5B8DB8]"
              />
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={sending || (!msgInput.trim() && !pendingMedia)}
              className="h-10 px-4 rounded-xl bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="p-3 bg-[#0c0e18] border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar space-y-3">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{cat.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setMsgInput(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-sm transition-transform hover:scale-125 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GIF Picker Popover */}
          {showGifPicker && (
            <div className="p-3 bg-[#0c0e18] border border-white/10 rounded-2xl shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film size={14} className="text-[#5B8DB8]" />
                  <span>Curated GIFs</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGifPicker(false)}
                  className="text-xs text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {CURATED_GIFS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setPendingMedia({ url: g.url, type: "image", name: g.title });
                      setShowGifPicker(false);
                    }}
                    className="group relative rounded-xl overflow-hidden border border-white/10 aspect-video hover:border-[#5B8DB8] transition-all cursor-pointer"
                  >
                    <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold p-1 text-center">
                      {g.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Effects Popover */}
          {showFxPicker && (
            <div className="p-3 bg-[#0c0e18] border border-white/10 rounded-2xl shadow-2xl flex flex-wrap gap-1.5">
              {TEXT_EFFECTS.map((fx) => (
                <button
                  key={fx.id}
                  type="button"
                  onClick={() => {
                    setSelectedEffect(fx.id);
                    setShowFxPicker(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedEffect === fx.id
                      ? "bg-[#5B8DB8] text-white shadow"
                      : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                  }`}
                >
                  <span>{fx.icon}</span>
                  <span>{fx.label}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* RIGHT SIDEBAR: COMMUNITY & MEMBERS ROSTER */}
      {/* ────────────────────────────────────────────────────────── */}
      {showMembersDrawer && (
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col bg-[#0c0e18] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#5B8DB8]" />
              <h2 className="text-xs font-bold text-white font-display uppercase tracking-wider">
                Community Roster ({communityMembers.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={loadCommunityMembers}
              disabled={membersLoading}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Refresh roster"
            >
              <RefreshCw size={13} className={membersLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-2.5 border-b border-white/5">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={memberSearchFilter}
                onChange={(e) => setMemberSearchFilter(e.target.value)}
                placeholder="Filter members..."
                className="h-7 pl-7 text-[11px] bg-[#08090d] border-white/10 rounded-lg text-white placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-xs text-white/40">No members found.</div>
            ) : (
              filteredMembers.map((m) => {
                const pfp = m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`;
                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-xl flex items-center justify-between gap-2 hover:bg-white/5 transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenProfileModal(m)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={pfp}
                          alt={m.username}
                          className="w-8 h-8 rounded-xl object-cover border border-white/10 bg-[#08090d]"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0c0e18]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate">{m.display_name || m.username}</span>
                        </div>
                        <p className="text-[10px] text-white/40 truncate">@{m.username}</p>
                      </div>
                    </button>

                    {/* Direct Message Action */}
                    {m.id !== user?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartDm(m)}
                        className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 text-[#5B8DB8] hover:bg-[#5B8DB8]/20 transition-all cursor-pointer"
                        title="Send Direct Message"
                      >
                        <MessageCircle size={14} />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* START DM MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={showStartDmModal} onOpenChange={setShowStartDmModal}>
        <DialogContent className="max-w-md bg-[#0c0e18] border-white/10 text-white rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-white flex items-center gap-2">
              <MessageCircle size={18} className="text-[#5B8DB8]" />
              <span>Start Direct Message</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#E5E7EB]/60">
              Direct message any creator on Swats.bio by entering their @username or picking from the community roster.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80">Username</label>
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B8DB8]" />
                <Input
                  value={dmTargetUsername}
                  onChange={(e) => setDmTargetUsername(e.target.value)}
                  placeholder="e.g. trackdown or swats"
                  className="pl-8 text-xs bg-[#08090d] border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#5B8DB8]"
                />
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pt-1">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Suggested Members</div>
              {communityMembers.filter(m => m.id !== user?.id).slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleStartDm(m)}
                  className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={m.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`}
                      alt={m.username}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{m.display_name || m.username}</div>
                      <div className="text-[10px] text-white/40">@{m.username}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5B8DB8] font-semibold">Message</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowStartDmModal(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={startingDm || !dmTargetUsername.trim()}
                onClick={() => handleStartDm(dmTargetUsername)}
                className="bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold px-4 rounded-xl shadow cursor-pointer"
              >
                {startingDm ? "Opening..." : "Start Chat"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MEMBER PROFILE MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={!!viewProfileUser} onOpenChange={() => setViewProfileUser(null)}>
        <DialogContent className="max-w-md bg-[#0c0e18] border-white/10 text-white rounded-2xl shadow-2xl p-6">
          {viewProfileUser && (
            <div className="space-y-4">
              {/* Header Profile Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#5B8DB8]/20 to-black/40 border border-[#5B8DB8]/30 flex items-center gap-4">
                <img
                  src={viewProfileUser.avatar_url || viewProfileUser.pfp || `https://api.dicebear.com/7.x/bottts/svg?seed=${viewProfileUser.username}`}
                  alt={viewProfileUser.username}
                  className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-xl"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white font-display truncate">
                    {viewProfileUser.display_name || viewProfileUser.username}
                  </h3>
                  <p className="text-xs text-[#5B8DB8] font-semibold">@{viewProfileUser.username}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <Eye size={12} className="text-[#5B8DB8]" />
                      <span>{viewProfileUser.views || 0} views</span>
                    </span>
                    {viewProfileUser.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#5B8DB8]" />
                        <span>{viewProfileUser.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Description */}
              {viewProfileUser.description && (
                <div className="p-3 rounded-xl bg-[#08090d] border border-white/10 text-xs text-white/80 leading-relaxed">
                  {renderBioText(viewProfileUser.description)}
                </div>
              )}

              {/* Badges */}
              {Array.isArray(viewProfileUser.badges) && viewProfileUser.badges.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Badges</div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewProfileUser.badges.map((b) => {
                      const def = BADGE_DEFS[b] || { label: b, color: "#5B8DB8" };
                      return (
                        <span
                          key={b}
                          className="px-2 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                          style={{
                            backgroundColor: `${def.color}20`,
                            color: def.color,
                            border: `1px solid ${def.color}40`
                          }}
                        >
                          <span>{def.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <a
                  href={`https://swats.bio/${viewProfileUser.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={13} />
                  <span>Open Public Bio</span>
                </a>

                {viewProfileUser.id !== user?.id && (
                  <Button
                    type="button"
                    onClick={() => {
                      handleStartDm(viewProfileUser);
                      setViewProfileUser(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#5B8DB8] hover:bg-[#4a7a9f] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Send Direct Message</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
