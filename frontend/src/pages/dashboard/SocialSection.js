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
  Sparkles, Search, UserPlus, Check, X, Shield, Lock, Pin,
  MoreVertical, RefreshCw, Paperclip, Hash, Heart, Clock, UserCheck,
  UserX, ExternalLink, Circle, MessageCircle, Crown, LogOut, Copy,
  Flame, Film, ChevronDown, CheckCheck, Eye, MapPin, Calendar, AtSign
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
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "friends"
  const [friendsSubTab, setFriendsSubTab] = useState("all"); // "all" | "incoming" | "outgoing"

  // Data
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("none");
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Members Drawer & Profile Modal State
  const [channelMembers, setChannelMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearchFilter, setMemberSearchFilter] = useState("");
  const [showMembersDrawer, setShowMembersDrawer] = useState(true);
  const [viewProfileUser, setViewProfileUser] = useState(null);
  const [viewProfileLoading, setViewProfileLoading] = useState(false);

  // Popups & Menus
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGifCategory, setSelectedGifCategory] = useState("All");
  const [gifSearch, setGifSearch] = useState("");
  const [showFxPicker, setShowFxPicker] = useState(false);

  // Context Menus
  const [contextMenu, setContextMenu] = useState(null); // { type: 'channel'|'message', x, y, data }

  // Modals
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedAddMemberIds, setSelectedAddMemberIds] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Load Friends Data
  const loadFriendsData = async () => {
    try {
      const { data } = await api.get("/social/friends");
      const payload = data && typeof data === "object" ? data : {};
      setFriends(Array.isArray(payload.friends) ? payload.friends : []);
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
      }
    } catch {
      const defaultLounge = {
        id: "community-general",
        name: "Swats Global Lounge",
        is_group: true,
        icon_url: "https://www.swats.bio/logo.png",
      };
      setChannels([defaultLounge]);
      if (!activeChannel) setActiveChannel(defaultLounge);
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
      // Ignore
    }
  };

  // Load Channel Members
  const loadChannelMembers = async (cid) => {
    if (!cid) return;
    setMembersLoading(true);
    try {
      const { data } = await api.get(`/social/channels/${cid}/members`);
      if (data && Array.isArray(data.members)) {
        setChannelMembers(data.members);
      } else {
        setChannelMembers([]);
      }
    } catch {
      setChannelMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Open Full Profile Card Modal
  const handleOpenUserProfile = async (targetUser) => {
    if (!targetUser) return;
    setViewProfileLoading(true);
    setViewProfileUser(targetUser);
    try {
      const { data } = await api.get(`/social/users/${targetUser.id || targetUser.user_id || targetUser.username}`);
      if (data) {
        setViewProfileUser(data);
      }
    } catch {
      // Keep optimistic user card
    } finally {
      setViewProfileLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
    loadChannels();
  }, []);

  // Polling for real-time live messages & load channel members
  useEffect(() => {
    if (!activeChannel?.id) return;
    loadMessages(activeChannel.id);
    loadChannelMembers(activeChannel.id);
    const interval = setInterval(() => {
      loadMessages(activeChannel.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Message
  const handleSendMessage = async (customMediaUrl = "", customMediaType = "") => {
    if (!activeChannel) return;
    const text = msgInput.trim();
    if (!text && !customMediaUrl) return;

    setSending(true);
    try {
      const { data } = await api.post(`/social/channels/${activeChannel.id}/messages`, {
        content: text,
        text_effect: selectedEffect,
        media_url: customMediaUrl,
        media_type: customMediaType
      });
      setMessages((prev) => [...prev, data]);
      setMsgInput("");
      setShowEmojiPicker(false);
      setShowGifPicker(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // File Upload Attachment
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      await handleSendMessage(data.url, mediaType);
      toast.success("Attachment sent!");
    } catch {
      toast.error("Failed to upload media attachment");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send GIF
  const handleSendGif = async (gifUrl) => {
    await handleSendMessage(gifUrl, "image");
    setShowGifPicker(false);
  };

  // Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (!activeChannel) return;
    try {
      await api.delete(`/social/channels/${activeChannel.id}/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not delete message");
    }
  };

  // Pin Message
  const handlePinMessage = async (msgId) => {
    if (!activeChannel) return;
    try {
      await api.post(`/social/channels/${activeChannel.id}/messages/${msgId}/pin`);
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, pinned: !m.pinned } : m));
      toast.success("Updated pinned status");
    } catch {
      toast.info("Pinned status toggled");
    }
  };

  // React to Message
  const handleReactMessage = async (msgId, emoji) => {
    if (!activeChannel) return;
    try {
      await api.post(`/social/channels/${activeChannel.id}/messages/${msgId}/react`, { emoji });
      loadMessages(activeChannel.id);
    } catch {
      // Local optimistic toggle
      setMessages((prev) => prev.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
        const idx = users.indexOf(user?.id);
        if (idx > -1) users.splice(idx, 1);
        else users.push(user?.id);
        if (users.length === 0) delete reactions[emoji];
        else reactions[emoji] = users;
        return { ...m, reactions };
      }));
    }
  };

  // Send Friend Request
  const handleSendFriendRequest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanUsername = addFriendUsername.replace(/^@+/, "").trim();
    if (!cleanUsername) return toast.error("Please enter a username");
    setAddingFriend(true);
    try {
      const { data } = await api.post("/social/friends/request", { username: cleanUsername });
      toast.success(data.message || `Friend request sent to @${cleanUsername}!`);
      setAddFriendUsername("");
      setShowAddFriendModal(false);
      loadFriendsData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send friend request");
    } finally {
      setAddingFriend(false);
    }
  };

  // Accept Friend Request
  const handleAcceptFriendRequest = async (reqId) => {
    try {
      await api.post("/social/friends/accept", { friendship_id: reqId });
      toast.success("Friend request accepted!");
      loadFriendsData();
      loadChannels();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not accept request");
    }
  };

  // Decline Friend Request
  const handleDeclineFriendRequest = async (reqId) => {
    try {
      await api.post("/social/friends/decline", { friendship_id: reqId });
      toast.success("Friend request declined");
      loadFriendsData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not decline request");
    }
  };

  // Remove Friend
  const handleRemoveFriend = async (friendshipId) => {
    try {
      await api.delete(`/social/friends/${friendshipId}`);
      toast.success("Friend removed");
      loadFriendsData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not remove friend");
    }
  };

  // Open / Start Direct Message with Friend or User
  const handleOpenDmWithFriend = async (friendUser) => {
    try {
      const { data } = await api.post("/social/channels", {
        name: friendUser.display_name || friendUser.username,
        is_group: false,
        member_ids: [friendUser.id || friendUser.user_id]
      });
      const newChannel = {
        id: data.id,
        name: friendUser.display_name || friendUser.username,
        is_group: false,
        icon_url: friendUser.avatar_url || friendUser.avatar || "",
        members: [user?.id, friendUser.id || friendUser.user_id]
      };
      setChannels((prev) => [newChannel, ...prev.filter(c => c.id !== newChannel.id)]);
      setActiveChannel(newChannel);
      setActiveTab("chat");
      if (viewProfileUser) setViewProfileUser(null);
    } catch {
      setActiveTab("chat");
      if (viewProfileUser) setViewProfileUser(null);
    }
  };

  // Create Group Chat
  const handleCreateGroupChat = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return toast.error("Please enter a group name");
    if (selectedGroupMembers.length === 0) return toast.error("Select at least 1 friend to add");

    setCreatingGroup(true);
    try {
      const { data } = await api.post("/social/channels", {
        name: groupName.trim(),
        is_group: true,
        member_ids: selectedGroupMembers
      });
      const newChannel = {
        id: data.id,
        name: groupName.trim(),
        is_group: true,
        owner_id: user?.id,
        members: [user?.id, ...selectedGroupMembers]
      };
      setChannels((prev) => [newChannel, ...prev]);
      setActiveChannel(newChannel);
      setShowCreateGroupModal(false);
      setGroupName("");
      setSelectedGroupMembers([]);
      toast.success(`Group "${groupName}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not create group chat");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Add Member to active Group Chat
  const handleAddMembersToGroup = async () => {
    if (!activeChannel || selectedAddMemberIds.length === 0) return;
    setAddingMembers(true);
    try {
      await api.post(`/social/channels/${activeChannel.id}/members`, {
        member_ids: selectedAddMemberIds
      });
      toast.success("Added members to group!");
      setShowAddMemberModal(false);
      setSelectedAddMemberIds([]);
      loadChannels();
      loadChannelMembers(activeChannel.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add members");
    } finally {
      setAddingMembers(false);
    }
  };

  // Delete or Leave Channel
  const handleDeleteChannel = async (cid) => {
    try {
      await api.delete(`/social/channels/${cid}`);
      setChannels((prev) => prev.filter((c) => c.id !== cid));
      if (activeChannel?.id === cid) {
        setActiveChannel(channels.find((c) => c.id !== cid) || null);
      }
      toast.success("Chat removed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not delete chat");
    }
  };

  // Filtered lists
  const filteredChannels = channels.filter((c) => {
    return (c.name || "").toLowerCase().includes(searchFilter.toLowerCase());
  });

  const filteredFriends = friends.filter((f) => {
    return `${f.username} ${f.display_name}`.toLowerCase().includes(searchFilter.toLowerCase());
  });

  const filteredMembers = channelMembers.filter((m) => {
    return `${m.username} ${m.display_name}`.toLowerCase().includes(memberSearchFilter.toLowerCase());
  });

  const staffMembers = useMemo(() => {
    return filteredMembers.filter(m => m.role === "admin" || (Array.isArray(m.badges) && (m.badges.includes("admin") || m.badges.includes("staff"))));
  }, [filteredMembers]);

  const regularMembers = useMemo(() => {
    return filteredMembers.filter(m => m.role !== "admin" && !(Array.isArray(m.badges) && (m.badges.includes("admin") || m.badges.includes("staff"))));
  }, [filteredMembers]);

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.pinned);
  }, [messages]);

  const filteredGifs = CURATED_GIFS.filter((g) => {
    const matchCat = selectedGifCategory === "All" || g.category === selectedGifCategory;
    const matchSearch = g.title.toLowerCase().includes(gifSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Navbar & Quick Switcher */}
      <div className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8] shadow-md">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-display flex items-center gap-2">
              <span>Friends & Community Lounge</span>
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-[#5B8DB8]/20 text-[#5B8DB8] border border-[#5B8DB8]/30">
                Live Swats Network
              </span>
            </h1>
            <p className="text-xs text-[#E5E7EB]/50">
              Swats Global Lounge for all members, direct messages, custom group chats, and rich creator profiles
            </p>
          </div>
        </div>

        {/* Action Tabs & Modals */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#07080c] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "chat" ? "bg-[#5B8DB8] text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <MessageSquare size={13} />
              <span>Messenger</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === "friends" ? "bg-[#5B8DB8] text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              <Users size={13} />
              <span>Friends</span>
              {incomingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          </div>

          <Button
            type="button"
            onClick={() => setShowAddFriendModal(true)}
            className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-9 px-3.5 rounded-xl shadow-md shadow-[#5B8DB8]/30 gap-1.5 cursor-pointer"
          >
            <UserPlus size={14} /> Add Friend
          </Button>
        </div>
      </div>

      {/* Main Container */}
      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[740px]">
          {/* ========================================================================= */}
          {/* LEFT CHANNEL / DM SIDEBAR                                                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 xl:col-span-3 rounded-2xl bg-[#0c0e18] border border-white/10 flex flex-col overflow-hidden shadow-lg">
            {/* Header & Search */}
            <div className="p-3 border-b border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B8DB8] flex items-center gap-1.5">
                  <Hash size={13} /> Channels & DMs
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(true)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#5B8DB8] hover:text-white transition-all text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  title="Create Group Chat"
                >
                  <Plus size={14} />
                  <span>Group</span>
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={13} />
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter conversations..."
                  className="bg-[#07080c] border-white/10 pl-8 text-xs text-white placeholder:text-white/30 h-8 rounded-xl"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {filteredChannels.map((c) => {
                const isSelected = activeChannel?.id === c.id;
                const isGlobal = c.id === "community-general";
                const isGroup = c.is_group;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveChannel(c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        type: "channel",
                        x: e.clientX,
                        y: e.clientY,
                        data: c,
                      });
                    }}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 group relative ${
                      isSelected
                        ? "bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 text-white"
                        : "bg-[#07080c]/60 hover:bg-white/5 border border-transparent text-white/70"
                    }`}
                  >
                    {/* Channel / DM Avatar */}
                    <div className="relative shrink-0">
                      {c.icon_url ? (
                        <MediaDisplay src={c.icon_url} className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B8DB8]/30 to-purple-600/30 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                          {isGlobal ? <Flame size={16} className="text-amber-400" /> : isGroup ? <Users size={16} /> : (c.name || "D").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c0e18]" />
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-[#E5E7EB]"}`}>
                          {c.name}
                        </span>
                        {isGlobal ? (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Global
                          </span>
                        ) : isGroup ? (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            Group
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-[#E5E7EB]/50 truncate mt-0.5">
                        {c.latest_message?.content || (isGlobal ? "All Swats members" : isGroup ? "Group lounge" : "Direct Message")}
                      </p>
                    </div>

                    {/* Context Menu Trigger */}
                    {!isGlobal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({
                            type: "channel",
                            x: e.clientX,
                            y: e.clientY,
                            data: c,
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-opacity cursor-pointer"
                      >
                        <MoreVertical size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CENTER CHAT WINDOW & RIGHT MEMBER DRAWER                                 */}
          {/* ========================================================================= */}
          <div className={`${showMembersDrawer ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-8 xl:col-span-9"} rounded-2xl bg-[#0c0e18] border border-white/10 flex overflow-hidden shadow-lg relative`}>
            {activeChannel ? (
              <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Chat Top Header */}
                <div className="p-3.5 border-b border-white/10 bg-[#07080c]/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      {activeChannel.icon_url ? (
                        <MediaDisplay src={activeChannel.icon_url} className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B8DB8]/30 to-purple-600/30 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                          {activeChannel.id === "community-general" ? <Flame size={16} className="text-amber-400" /> : activeChannel.is_group ? <Users size={16} /> : (activeChannel.name || "D").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#07080c]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white truncate font-display">
                          {activeChannel.name}
                        </h2>
                        {activeChannel.id === "community-general" ? (
                          <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            {channelMembers.length || "All"} Community Members
                          </span>
                        ) : activeChannel.is_group ? (
                          <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                            {channelMembers.length || (activeChannel.members || []).length || 2} Members
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected · Live Stream</span>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1.5">
                    {activeChannel.is_group && activeChannel.id !== "community-general" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddMemberIds([]);
                          setShowAddMemberModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-white/5 cursor-pointer"
                        title="Invite Friends"
                      >
                        <UserPlus size={13} />
                        <span className="hidden sm:inline">Invite</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowMembersDrawer(!showMembersDrawer)}
                      className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                        showMembersDrawer ? "bg-[#5B8DB8] text-white border-[#5B8DB8] shadow-md" : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                      }`}
                      title="Toggle Members Roster Panel"
                    >
                      <Users size={14} />
                      <span className="text-xs font-semibold hidden md:inline">
                        {channelMembers.length || ""}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pinned Messages Header Banner */}
                {pinnedMessages.length > 0 && (
                  <div className="px-4 py-2 bg-[#5B8DB8]/10 border-b border-[#5B8DB8]/30 flex items-center justify-between text-xs text-[#5B8DB8]">
                    <div className="flex items-center gap-2 truncate">
                      <Pin size={13} className="shrink-0 text-amber-400" />
                      <span className="font-bold shrink-0">Pinned ({pinnedMessages.length}):</span>
                      <span className="truncate text-white/80">{pinnedMessages[0].content}</span>
                    </div>
                  </div>
                )}

                {/* Chat Stream Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[#08090d]/40">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                        <MessageSquare size={28} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">This is the start of #{activeChannel.name}</div>
                        <p className="text-xs text-[#E5E7EB]/50 max-w-sm">
                          Send a message, attach images, or pick interactive emojis to get the conversation started!
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      const reactions = m.reactions || {};
                      const effectClass = m.text_effect === "glow" ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" :
                        m.text_effect === "rainbow" ? "bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 to-cyan-400 bg-clip-text text-transparent font-bold" :
                        m.text_effect === "fire" ? "text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] font-bold" :
                        m.text_effect === "glitch" ? "text-pink-400 font-mono" :
                        m.text_effect === "wave" ? "text-purple-300 animate-pulse" : "";

                      return (
                        <div
                          key={m.id}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              type: "message",
                              x: e.clientX,
                              y: e.clientY,
                              data: m,
                            });
                          }}
                          className="group relative flex items-start gap-3 hover:bg-white/[0.02] p-2 rounded-xl transition-all"
                        >
                          {/* Sender Avatar with Profile Modal Trigger */}
                          <div
                            onClick={() => handleOpenUserProfile(m.sender)}
                            className="shrink-0 pt-0.5 cursor-pointer hover:scale-105 transition-transform"
                            title={`View @${m.sender?.username}'s profile`}
                          >
                            <MediaDisplay
                              src={m.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.sender?.username || "user"}`}
                              className="w-9 h-9 rounded-xl object-cover border border-white/10 hover:border-[#5B8DB8]"
                            />
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                onClick={() => handleOpenUserProfile(m.sender)}
                                className="text-xs font-bold text-white hover:text-[#5B8DB8] cursor-pointer truncate transition-colors flex items-center gap-1.5"
                              >
                                <span>{m.sender?.display_name || m.sender?.username}</span>
                                {m.sender?.role === "admin" && (
                                  <Crown size={12} className="text-amber-400 shrink-0" title="Admin" />
                                )}
                              </span>
                              <span className="text-[10px] text-[#5B8DB8] font-mono">
                                @{m.sender?.username}
                              </span>
                              <span className="text-[10px] text-white/30">
                                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                              {m.pinned && (
                                <Pin size={11} className="text-amber-400 ml-1" title="Pinned" />
                              )}
                            </div>

                            {/* Text Message */}
                            {m.content && (
                              <div className={`text-xs text-white/90 break-words leading-relaxed ${effectClass}`}>
                                {m.content}
                              </div>
                            )}

                            {/* Media Attachment */}
                            {m.media_url && (
                              <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-white/10 bg-black/40">
                                {m.media_type === "video" ? (
                                  <video src={fileUrl(m.media_url)} controls className="w-full max-h-60 object-cover" />
                                ) : (
                                  <img src={fileUrl(m.media_url)} alt="Attachment" className="w-full max-h-60 object-cover" />
                                )}
                              </div>
                            )}

                            {/* Reactions Pill Display */}
                            {Object.keys(reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 pt-1">
                                {Object.entries(reactions).map(([emoji, uids]) => {
                                  const hasReacted = Array.isArray(uids) && uids.includes(user?.id);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleReactMessage(m.id, emoji)}
                                      className={`px-2 py-0.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                        hasReacted
                                          ? "bg-[#5B8DB8]/30 border-[#5B8DB8] text-white"
                                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[10px] font-mono">{uids.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Quick Floating Action Bar on Hover */}
                          <div className="absolute right-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#0c0e18] border border-white/15 px-2 py-1 rounded-xl shadow-xl z-20">
                            <button
                              type="button"
                              onClick={() => handleReactMessage(m.id, "🔥")}
                              className="p-1 hover:bg-white/10 rounded text-xs cursor-pointer"
                              title="React 🔥"
                            >
                              🔥
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReactMessage(m.id, "❤️")}
                              className="p-1 hover:bg-white/10 rounded text-xs cursor-pointer"
                              title="React ❤️"
                            >
                              ❤️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReactMessage(m.id, "👑")}
                              className="p-1 hover:bg-white/10 rounded text-xs cursor-pointer"
                              title="React 👑"
                            >
                              👑
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePinMessage(m.id)}
                              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer"
                              title={m.pinned ? "Unpin message" : "Pin message"}
                            >
                              <Pin size={12} className={m.pinned ? "text-amber-400" : ""} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(m.content);
                                toast.success("Copied message text");
                              }}
                              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer"
                              title="Copy text"
                            >
                              <Copy size={12} />
                            </button>
                            {(isMe || user?.role === "admin") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                className="p-1 hover:bg-red-500/20 text-red-400 rounded cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Input Area */}
                <div className="p-3 border-t border-white/10 bg-[#07080c]/80 relative">
                  {/* Floating Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div className="absolute left-4 bottom-16 w-80 bg-[#0c0e18] border border-white/15 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-xs font-bold text-[#5B8DB8] uppercase tracking-wider">Discord Emojis</span>
                        <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-white/40 hover:text-white cursor-pointer">
                          <X size={13} />
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                        {EMOJI_CATEGORIES.map((cat) => (
                          <div key={cat.name}>
                            <div className="text-[10px] uppercase font-bold text-white/40 mb-1">{cat.name}</div>
                            <div className="grid grid-cols-7 gap-1.5">
                              {cat.emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setMsgInput((prev) => prev + emoji);
                                  }}
                                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floating GIF Picker Popover */}
                  {showGifPicker && (
                    <div className="absolute left-12 bottom-16 w-96 bg-[#0c0e18] border border-white/15 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-xs font-bold text-[#5B8DB8] uppercase tracking-wider">GIF Studio</span>
                        <button type="button" onClick={() => setShowGifPicker(false)} className="text-white/40 hover:text-white cursor-pointer">
                          <X size={13} />
                        </button>
                      </div>
                      <Input
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                        placeholder="Search trending GIFs..."
                        className="h-7 text-xs bg-[#07080c] border-white/10 rounded-lg text-white"
                      />
                      <div className="max-h-64 overflow-y-auto grid grid-cols-2 gap-2 scrollbar-thin pr-1">
                        {filteredGifs.map((gif) => (
                          <div
                            key={gif.id}
                            onClick={() => handleSendGif(gif.url)}
                            className="h-28 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-[#5B8DB8] hover:scale-102 transition-all relative group"
                          >
                            <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity">
                              Send GIF
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floating Text FX Selector */}
                  {showFxPicker && (
                    <div className="absolute right-14 bottom-16 w-56 bg-[#0c0e18] border border-white/15 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-40 space-y-1.5">
                      <div className="text-xs font-bold text-[#5B8DB8] uppercase tracking-wider pb-1 border-b border-white/10">
                        Text Atmosphere FX
                      </div>
                      {TEXT_EFFECTS.map((fx) => (
                        <button
                          key={fx.id}
                          type="button"
                          onClick={() => {
                            setSelectedEffect(fx.id);
                            setShowFxPicker(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            selectedEffect === fx.id ? "bg-[#5B8DB8] text-white" : "hover:bg-white/5 text-white/70 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{fx.icon}</span>
                            <span>{fx.label}</span>
                          </span>
                          {selectedEffect === fx.id && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Row */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* File Attachment Hidden Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingMedia}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                      title="Attach Image / Video"
                    >
                      <Paperclip size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowGifPicker(false);
                        setShowFxPicker(false);
                      }}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        showEmojiPicker ? "bg-[#5B8DB8] text-white border-[#5B8DB8]" : "bg-white/5 hover:bg-white/15 border-white/10 text-white/60 hover:text-white"
                      }`}
                      title="Emoji Picker"
                    >
                      <Smile size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowGifPicker(!showGifPicker);
                        setShowEmojiPicker(false);
                        setShowFxPicker(false);
                      }}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 font-black text-xs ${
                        showGifPicker ? "bg-[#5B8DB8] text-white border-[#5B8DB8]" : "bg-white/5 hover:bg-white/15 border-white/10 text-white/60 hover:text-white"
                      }`}
                      title="GIFs"
                    >
                      GIF
                    </button>

                    {/* Text Field */}
                    <div className="relative flex-1">
                      <Input
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        placeholder={`Message #${activeChannel.name}... (Press Enter to send)`}
                        className="bg-[#07080c] border-white/10 text-xs text-white placeholder:text-white/30 h-9 rounded-xl pr-16"
                      />

                      {/* Inline FX Selector Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowFxPicker(!showFxPicker);
                          setShowEmojiPicker(false);
                          setShowGifPicker(false);
                        }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                          selectedEffect !== "none"
                            ? "bg-[#5B8DB8] text-white border-[#5B8DB8]"
                            : "bg-white/5 text-white/50 hover:text-white border-white/10"
                        }`}
                      >
                        <Sparkles size={10} />
                        <span>FX</span>
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={sending || (!msgInput.trim() && !uploadingMedia)}
                      className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white h-9 px-4 rounded-xl shadow-md shadow-[#5B8DB8]/30 gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send size={14} />
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex-1 flex items-center justify-center text-xs text-white/40">
                Select a channel or direct message to start chatting
              </div>
            )}

            {/* ===================================================================== */}
            {/* RIGHT SIDE MEMBERS ROSTER DRAWER (Live Community / Channel Members)   */}
            {/* ===================================================================== */}
            {showMembersDrawer && activeChannel && (
              <div className="w-64 border-l border-white/10 bg-[#07080c]/90 flex flex-col h-full shrink-0">
                <div className="p-3 border-b border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B8DB8] flex items-center gap-1.5">
                      <Users size={12} />
                      <span>{activeChannel.id === "community-general" ? "Community Roster" : "Channel Members"}</span>
                    </span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/60 font-mono">
                      {channelMembers.length}
                    </span>
                  </div>
                  <Input
                    value={memberSearchFilter}
                    onChange={(e) => setMemberSearchFilter(e.target.value)}
                    placeholder="Search members..."
                    className="h-7 text-[11px] bg-[#0c0e18] border-white/10 rounded-lg text-white"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
                  {membersLoading ? (
                    <div className="text-center py-6 text-xs text-white/40 animate-pulse">
                      Loading members...
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-white/40">
                      No members found
                    </div>
                  ) : (
                    <>
                      {/* Staff / Leadership Group */}
                      {staffMembers.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-2 text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                            <Crown size={11} /> Leadership & Staff — {staffMembers.length}
                          </div>
                          {staffMembers.map((m) => (
                            <div
                              key={m.id || m.user_id}
                              onClick={() => handleOpenUserProfile(m)}
                              className="p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="relative shrink-0">
                                  <MediaDisplay
                                    src={m.avatar_url || m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`}
                                    className="w-7 h-7 rounded-lg object-cover border border-white/10"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0c0e18]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                                    <span className="truncate">{m.display_name || m.username}</span>
                                    <Crown size={10} className="text-amber-400 shrink-0" />
                                  </div>
                                  <div className="text-[10px] text-[#5B8DB8] font-mono truncate">
                                    @{m.username}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDmWithFriend(m);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-white transition-all cursor-pointer"
                                title="Send Direct Message"
                              >
                                <MessageSquare size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Community Members Group */}
                      <div className="space-y-1">
                        <div className="px-2 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                          Members — {regularMembers.length}
                        </div>
                        {regularMembers.map((m) => (
                          <div
                            key={m.id || m.user_id}
                            onClick={() => handleOpenUserProfile(m)}
                            className="p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="relative shrink-0">
                                <MediaDisplay
                                  src={m.avatar_url || m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.username}`}
                                  className="w-7 h-7 rounded-lg object-cover border border-white/10"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0c0e18]" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {m.display_name || m.username}
                                </div>
                                <div className="text-[10px] text-white/40 font-mono truncate">
                                  @{m.username}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDmWithFriend(m);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-white transition-all cursor-pointer"
                              title="Send Direct Message"
                            >
                              <MessageSquare size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* FRIENDS TAB & RICH PROFILE CARDS                                          */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFriendsSubTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  friendsSubTab === "all" ? "bg-[#5B8DB8] text-white shadow-md" : "text-white/60 hover:text-white bg-[#0c0e18]"
                }`}
              >
                All Friends ({friends.length})
              </button>
              <button
                type="button"
                onClick={() => setFriendsSubTab("incoming")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                  friendsSubTab === "incoming" ? "bg-[#5B8DB8] text-white shadow-md" : "text-white/60 hover:text-white bg-[#0c0e18]"
                }`}
              >
                Incoming Requests
                {incomingRequests.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFriendsSubTab("outgoing")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  friendsSubTab === "outgoing" ? "bg-[#5B8DB8] text-white shadow-md" : "text-white/60 hover:text-white bg-[#0c0e18]"
                }`}
              >
                Sent Requests ({outgoingRequests.length})
              </button>
            </div>
          </div>

          {/* Tab Subcontent */}
          {friendsSubTab === "all" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredFriends.length === 0 ? (
                <div className="col-span-full p-8 rounded-2xl bg-[#0c0e18] border border-white/10 text-center space-y-2">
                  <Users className="mx-auto text-white/30" size={32} />
                  <div className="text-sm font-bold text-white">No friends yet</div>
                  <p className="text-xs text-[#E5E7EB]/50">Click "Add Friend" at the top to connect with creators across Swats.bio.</p>
                </div>
              ) : (
                filteredFriends.map((f) => (
                  <div
                    key={f.id || f.user_id}
                    className="rounded-2xl bg-[#0c0e18] border border-white/10 hover:border-[#5B8DB8]/50 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
                  >
                    {/* Header Banner Cover */}
                    <div className="h-16 w-full bg-gradient-to-r from-[#1c2438] via-[#243352] to-[#1a233a] relative overflow-hidden">
                      {f.banner || f.banner_url ? (
                        <MediaDisplay src={f.banner || f.banner_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DB8]/30 to-purple-600/30" />
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(f.friendship_id)}
                          className="p-1 rounded-lg bg-black/50 hover:bg-red-500/80 text-white/70 hover:text-white transition-all cursor-pointer"
                          title="Remove Friend"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Card Profile Info */}
                    <div className="p-3.5 pt-0 space-y-2.5 relative">
                      <div className="flex items-end justify-between -mt-6">
                        <div
                          onClick={() => handleOpenUserProfile(f)}
                          className="relative cursor-pointer hover:scale-105 transition-transform"
                        >
                          <MediaDisplay
                            src={f.avatar_url || f.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-[#0c0e18] shadow-md"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c0e18]" />
                        </div>

                        <div className="flex items-center gap-1">
                          {Array.isArray(f.badges) && f.badges.slice(0, 3).map((b) => (
                            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#5B8DB8] font-bold">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        onClick={() => handleOpenUserProfile(f)}
                        className="cursor-pointer space-y-0.5"
                      >
                        <div className="text-xs font-bold text-white truncate group-hover:text-[#5B8DB8] transition-colors">
                          {f.display_name || f.username}
                        </div>
                        <div className="text-[10px] text-[#5B8DB8] font-mono truncate">
                          @{f.username}
                        </div>
                        {f.description || f.bio ? (
                          <p className="text-[11px] text-white/60 line-clamp-2 mt-1">
                            {f.description || f.bio}
                          </p>
                        ) : null}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <Button
                          type="button"
                          onClick={() => handleOpenDmWithFriend(f)}
                          className="flex-1 bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-7 rounded-lg gap-1 cursor-pointer"
                        >
                          <MessageSquare size={12} /> Message
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOpenUserProfile(f)}
                          className="border-white/10 hover:bg-white/5 text-white/80 text-xs font-semibold h-7 px-2.5 rounded-lg cursor-pointer"
                        >
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {friendsSubTab === "incoming" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {incomingRequests.length === 0 ? (
                <div className="col-span-full p-8 rounded-2xl bg-[#0c0e18] border border-white/10 text-center text-xs text-white/50">
                  No incoming friend requests at this time.
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div key={req.friendship_id} className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <MediaDisplay
                        src={req.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.username}`}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{req.display_name || req.username}</div>
                        <div className="text-[10px] text-[#5B8DB8] font-mono truncate">@{req.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => handleAcceptFriendRequest(req.friendship_id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-7 rounded-lg gap-1 cursor-pointer"
                      >
                        <Check size={12} /> Accept
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDeclineFriendRequest(req.friendship_id)}
                        className="flex-1 border-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 text-xs font-bold h-7 rounded-lg gap-1 cursor-pointer"
                      >
                        <X size={12} /> Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {friendsSubTab === "outgoing" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {outgoingRequests.length === 0 ? (
                <div className="col-span-full p-8 rounded-2xl bg-[#0c0e18] border border-white/10 text-center text-xs text-white/50">
                  No pending sent friend requests.
                </div>
              ) : (
                outgoingRequests.map((req) => (
                  <div key={req.friendship_id} className="p-4 rounded-2xl bg-[#0c0e18] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <MediaDisplay
                        src={req.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.username}`}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">@{req.username}</div>
                        <div className="text-[10px] text-amber-400 font-medium">Pending Response...</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(req.friendship_id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 cursor-pointer"
                      title="Cancel Request"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DISCORD-STYLE USER PROFILE MODAL (Inspect Any User)                       */}
      {/* ========================================================================= */}
      {viewProfileUser && (
        <Dialog open={!!viewProfileUser} onOpenChange={() => setViewProfileUser(null)}>
          <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden">
            {/* Header Banner */}
            <div className="h-28 w-full bg-gradient-to-r from-[#1c2438] via-[#2a3a5e] to-[#1a233a] relative overflow-hidden">
              {viewProfileUser.banner || viewProfileUser.banner_url ? (
                <MediaDisplay src={viewProfileUser.banner || viewProfileUser.banner_url} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#5B8DB8]/30 via-purple-600/30 to-blue-900/40" />
              )}
              <button
                type="button"
                onClick={() => setViewProfileUser(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white transition-all cursor-pointer z-10"
              >
                <X size={14} />
              </button>
            </div>

            {/* Profile Avatar & Primary Badges */}
            <div className="px-5 pb-5 pt-0 space-y-4 relative">
              <div className="flex items-end justify-between -mt-10">
                <div className="relative">
                  <MediaDisplay
                    src={viewProfileUser.avatar_url || viewProfileUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${viewProfileUser.username}`}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-[#0c0e18] shadow-2xl bg-[#0c0e18]"
                  />
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c0e18]" />
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    onClick={() => handleOpenDmWithFriend(viewProfileUser)}
                    className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-3.5 rounded-xl shadow-md gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={13} /> Send DM
                  </Button>
                  <a
                    href={`/${viewProfileUser.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-all text-xs flex items-center gap-1"
                    title="Open Live Public Bio"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Identity & Badges */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5 font-display">
                    <span>{viewProfileUser.display_name || viewProfileUser.username}</span>
                    {viewProfileUser.role === "admin" && (
                      <Crown size={14} className="text-amber-400" title="Admin" />
                    )}
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#5B8DB8]">
                    {viewProfileUser.role || "user"}
                  </span>
                </div>
                <div className="text-xs text-[#5B8DB8] font-mono flex items-center gap-1">
                  <AtSign size={12} />
                  <span>{viewProfileUser.username}</span>
                </div>
              </div>

              {/* Custom Badges Pills */}
              {Array.isArray(viewProfileUser.badges) && viewProfileUser.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#07080c] border border-white/10">
                  {viewProfileUser.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-[#5B8DB8]/15 border border-[#5B8DB8]/30 text-[#5B8DB8] font-bold uppercase tracking-wider"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio Description Box */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-white/40">About Me</div>
                <div className="p-3 rounded-xl bg-[#07080c] border border-white/10 text-xs text-white/90 leading-relaxed min-h-[48px]">
                  {viewProfileUser.description || viewProfileUser.bio || (
                    <span className="text-white/30 italic">No bio description provided yet.</span>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-white/60">
                <div className="p-2 rounded-xl bg-[#07080c] border border-white/10 flex items-center gap-2">
                  <Eye size={13} className="text-[#5B8DB8]" />
                  <span>{viewProfileUser.views || 0} Profile Views</span>
                </div>
                <div className="p-2 rounded-xl bg-[#07080c] border border-white/10 flex items-center gap-2">
                  <Calendar size={13} className="text-[#5B8DB8]" />
                  <span>Swats Member</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM CONTEXT MENUS (Right-Click)                                        */}
      {/* ========================================================================= */}
      {contextMenu && (
        <div
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 220) }}
          className="fixed z-50 w-52 bg-[#0c0e18] border border-white/15 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-xs text-[#E5E7EB] space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "channel" && (
            <>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B8DB8] border-b border-white/10 mb-1">
                Channel Controls
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.data.id);
                  toast.success("Copied Channel ID");
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Copy size={13} /> Copy Channel ID
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroupModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={13} /> Create Group Chat
              </button>
              {contextMenu.data.id !== "community-general" && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteChannel(contextMenu.data.id);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={13} /> Delete / Close Chat
                </button>
              )}
            </>
          )}

          {contextMenu.type === "message" && (
            <>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5B8DB8] border-b border-white/10 mb-1">
                Message Controls
              </div>
              <button
                type="button"
                onClick={() => {
                  handlePinMessage(contextMenu.data.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Pin size={13} /> {contextMenu.data.pinned ? "Unpin Message" : "Pin Message"}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.data.content);
                  toast.success("Copied message text");
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Copy size={13} /> Copy Message
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteMessage(contextMenu.data.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={13} /> Delete Message
              </button>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Add Friend Modal */}
      <Dialog open={showAddFriendModal} onOpenChange={setShowAddFriendModal}>
        <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
              <UserPlus className="text-[#5B8DB8]" size={18} />
              <span>Add Friend on Swats.bio</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendFriendRequest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-semibold">User Tag or Username</label>
              <Input
                value={addFriendUsername}
                onChange={(e) => setAddFriendUsername(e.target.value)}
                placeholder="e.g. fed or @fed"
                className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddFriendModal(false)}
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addingFriend || !addFriendUsername.trim()}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md cursor-pointer"
              >
                {addingFriend ? "Sending..." : "Send Friend Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Group Chat Modal */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
              <Users className="text-[#5B8DB8]" size={18} />
              <span>Create Group Chat Hub</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroupChat} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-semibold">Group Hub Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Elite Squad or Dev Lounge"
                className="bg-[#07080c] border-white/10 text-white text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-semibold">Select Friends to Add ({selectedGroupMembers.length})</label>
              <div className="max-h-48 overflow-y-auto space-y-1 bg-[#07080c] p-2 rounded-xl border border-white/10 scrollbar-thin">
                {friends.length === 0 ? (
                  <div className="text-xs text-white/40 p-3 text-center">Add friends first to create group chats!</div>
                ) : (
                  friends.map((f) => {
                    const isChecked = selectedGroupMembers.includes(f.id || f.user_id);
                    return (
                      <div
                        key={f.id || f.user_id}
                        onClick={() => {
                          const fid = f.id || f.user_id;
                          if (isChecked) setSelectedGroupMembers((prev) => prev.filter((id) => id !== fid));
                          else setSelectedGroupMembers((prev) => [...prev, fid]);
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all ${
                          isChecked ? "bg-[#5B8DB8]/20 text-white border border-[#5B8DB8]/30" : "hover:bg-white/5 text-white/70"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MediaDisplay src={f.avatar_url || f.avatar} className="w-6 h-6 rounded-md object-cover" />
                          <span className="font-bold truncate">{f.display_name || f.username}</span>
                        </div>
                        {isChecked && <Check size={14} className="text-[#5B8DB8]" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateGroupModal(false)}
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingGroup || !groupName.trim() || selectedGroupMembers.length === 0}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md cursor-pointer"
              >
                {creatingGroup ? "Creating..." : "Create Group Chat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Members to Group Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="max-w-md bg-[#0c0e18] border border-[#2b384e] text-white p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white font-display flex items-center gap-2">
              <UserPlus className="text-[#5B8DB8]" size={18} />
              <span>Invite Friends to #{activeChannel?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="max-h-56 overflow-y-auto space-y-1 bg-[#07080c] p-2 rounded-xl border border-white/10 scrollbar-thin">
              {friends.filter(f => !(activeChannel?.members || []).includes(f.id || f.user_id)).length === 0 ? (
                <div className="text-xs text-white/40 p-3 text-center">All your friends are already in this group!</div>
              ) : (
                friends
                  .filter(f => !(activeChannel?.members || []).includes(f.id || f.user_id))
                  .map((f) => {
                    const fid = f.id || f.user_id;
                    const isChecked = selectedAddMemberIds.includes(fid);
                    return (
                      <div
                        key={fid}
                        onClick={() => {
                          if (isChecked) setSelectedAddMemberIds((prev) => prev.filter((id) => id !== fid));
                          else setSelectedAddMemberIds((prev) => [...prev, fid]);
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-all ${
                          isChecked ? "bg-[#5B8DB8]/20 text-white border border-[#5B8DB8]/30" : "hover:bg-white/5 text-white/70"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MediaDisplay src={f.avatar_url || f.avatar} className="w-6 h-6 rounded-md object-cover" />
                          <span className="font-bold truncate">{f.display_name || f.username}</span>
                        </div>
                        {isChecked && <Check size={14} className="text-[#5B8DB8]" />}
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddMemberModal(false)}
                className="border-white/10 hover:bg-white/5 text-xs text-white/70 h-8 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={addingMembers || selectedAddMemberIds.length === 0}
                onClick={handleAddMembersToGroup}
                className="bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md cursor-pointer"
              >
                {addingMembers ? "Adding..." : "Add to Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
