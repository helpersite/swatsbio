import React, { useState, useEffect, useRef } from "react";
import { useAuth, api, fileUrl } from "@/lib/auth";
import { renderBioText, stripEffectSyntax } from "@/lib/textEffects";
import { BADGE_DEFS } from "@/pages/dashboard/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaDisplay } from "@/components/MediaDisplay";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import {
  Users, MessageSquare, Plus, Send, Image, Smile, Trash2,
  Sparkles, Search, UserPlus, Check, X, Shield, Lock,
  MoreVertical, RefreshCw, Paperclip, Hash, Heart, Clock, UserCheck, UserX, ExternalLink
} from "lucide-react";

const EMOJI_LIST = [
  "🔥", "✨", "👑", "⚡", "💎", "🚀", "💀", "🖤", "💜", "💙", "💖", "⭐",
  "🎯", "🎮", "👾", "👀", "🛸", "🛡️", "⚔️", "🏆", "🌟", "🥀", "🪄", "🔮",
  "💯", "🎉", "💸", "🎧", "🕹️", "🌪️", "🌊", "🧊", "🌙", "🪐", "🥂", "🎬"
];

const POPULAR_GIFS = [
  { title: "Vibe", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif" },
  { title: "Cat Jam", url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif" },
  { title: "Hype", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif" },
  { title: "Cool", url: "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif" },
  { title: "Wave", url: "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif" },
  { title: "Fire", url: "https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif" },
  { title: "Thumbs Up", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
  { title: "Party", url: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif" },
  { title: "Laugh", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif" },
  { title: "Wow", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
];

const TEXT_EFFECTS = [
  { id: "none", label: "Normal" },
  { id: "glow", label: "Glow" },
  { id: "rainbow", label: "Rainbow" },
  { id: "neon", label: "Neon" },
  { id: "glitch", label: "Glitch" },
  { id: "fire", label: "Fire" },
  { id: "sparkle", label: "Sparkle" },
  { id: "wave", label: "Wave" },
];

function SharedProfilePreview({ content }) {
  const match = String(content || "").match(/https?:\/\/(?:www\.)?swats\.bio\/([a-z0-9_-]{2,32})(?:[/?#\s]|$)/i);
  const username = match?.[1]?.toLowerCase();
  const [bio, setBio] = useState(null);

  useEffect(() => {
    if (!username || ["api", "dashboard", "s", "auth", "pricing", "legal"].includes(username)) return undefined;
    let active = true;
    api.get(`/profile-preview/${username}`).then(({ data }) => { if (active) setBio(data); }).catch(() => {});
    return () => { active = false; };
  }, [username]);

  if (!username || !bio) return null;
  const settings = bio.settings || {};
  const accent = settings.accent_color || "#5B8DB8";
  const cover = fileUrl(settings.header_banner || settings.backgrounds?.[0] || settings.banner);
  const avatar = fileUrl(settings.pfp) || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  return (
    <a href={`https://www.swats.bio/${username}`} target="_blank" rel="noreferrer" className="mt-2 block w-72 max-w-full overflow-hidden rounded-lg border border-white/10 bg-black/40 text-left hover:border-white/25">
      <div className="relative h-20 overflow-hidden bg-[#111419]" style={{ backgroundImage: cover ? `url(${cover})` : `linear-gradient(135deg, ${accent}55, #111419)` , backgroundSize: "cover", backgroundPosition: "center" }}>
        {cover && /\.(mp4|webm|mov|m4v)([?#]|$)/i.test(cover) && <MediaDisplay src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      <div className="flex items-center gap-2.5 p-3">
        <MediaDisplay src={avatar} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-white">{bio.display_name || username}</div>
          <div className="truncate text-[10px] text-white/55">@{username} · {(bio.views || 0).toLocaleString()} views</div>
        </div>
        <ExternalLink size={13} className="shrink-0" style={{ color: accent }} />
      </div>
      {bio.description && <div className="px-3 pb-3 text-[10px] leading-relaxed text-white/65 line-clamp-2">{bio.description}</div>}
    </a>
  );
}

export default function SocialSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "friends"
  const [friendsSubTab, setFriendsSubTab] = useState("all"); // "all" | "incoming" | "outgoing"

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState("");

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesError, setMessagesError] = useState("");
  const [channelsError, setChannelsError] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("none");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Modals
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupMembersMode, setGroupMembersMode] = useState(false);
  const [groupActionChannel, setGroupActionChannel] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef(null);
  const activeMessagesChannelIdRef = useRef(null);
  const messageRequestRef = useRef(0);

  // Load Friends & Requests
  const loadFriendsData = async () => {
    setFriendsError("");
    try {
      const { data } = await api.get("/social/friends");
      const payload = data && typeof data === "object" ? data : {};
      const nextFriends = Array.isArray(payload.friends) ? payload.friends : Array.isArray(data) ? data : [];
      const nextIncoming = Array.isArray(payload.incoming_requests) ? payload.incoming_requests : [];
      const nextOutgoing = Array.isArray(payload.outgoing_requests) ? payload.outgoing_requests : [];

      setFriends(nextFriends);
      setIncomingRequests(nextIncoming);
      setOutgoingRequests(nextOutgoing);
      if (!nextFriends.length && !nextIncoming.length && !nextOutgoing.length) {
        setFriendsError("");
      }
    } catch (error) {
      if (error?.response?.status === 404 || error?.response?.status === 204) {
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setFriendsError("");
      } else {
        setFriendsError(error.response?.data?.detail || "Friends could not load.");
      }
    } finally {
      setFriendsLoading(false);
    }
  };

  // Load Channels
  const loadChannels = async () => {
    setChannelsError("");
    try {
      const { data } = await api.get("/social/channels");
      const list = Array.isArray(data) ? data : [];
      setChannels(list);
      if (list.length > 0 && !activeChannel) {
        setActiveChannel(list[0]);
      }
    } catch (error) {
      setChannelsError(error.response?.data?.detail || "Conversations could not load.");
    }
  };

  // Load Messages for active channel
  const loadMessages = async (cid) => {
    if (!cid) return;
    const requestId = ++messageRequestRef.current;
    setMessagesError("");
    try {
      const { data } = await api.get(`/social/channels/${cid}/messages`);
      if (activeMessagesChannelIdRef.current === cid && messageRequestRef.current === requestId) {
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (activeMessagesChannelIdRef.current === cid && messageRequestRef.current === requestId) {
        setMessagesError(error.response?.data?.detail || "Messages could not load.");
      }
    }
  };

  useEffect(() => {
    loadFriendsData();
    loadChannels();
    const interval = setInterval(loadFriendsData, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channelId = activeChannel?.id || null;
    activeMessagesChannelIdRef.current = channelId;
    messageRequestRef.current += 1;
    shouldAutoScrollRef.current = true;
    setMessagesError("");
    setMessages([]);
    if (!channelId) return undefined;
    loadMessages(channelId);
    const interval = setInterval(() => loadMessages(channelId), 5000);
    return () => {
      clearInterval(interval);
      messageRequestRef.current += 1;
    };
  }, [activeChannel?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (shouldAutoScrollRef.current || distanceFromBottom < 120) {
      shouldAutoScrollRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const updateAutoScroll = (event) => {
    const container = event.currentTarget;
    shouldAutoScrollRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  };

  // Send Friend Request Handler
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

  // Accept Friend Request
  const handleAcceptRequest = async (friendId, username) => {
    try {
      const { data } = await api.post("/social/friends/accept", { friend_id: friendId });
      toast.success(data.message || `Accepted friend request from @${username}!`);
      loadFriendsData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to accept request.");
    }
  };

  // Decline / Cancel Friend Request
  const handleDeclineRequest = async (friendId, username) => {
    try {
      await api.post("/social/friends/decline", { friend_id: friendId });
      toast.success(`Declined request from @${username}`);
      loadFriendsData();
    } catch (err) {
      toast.error("Failed to decline request.");
    }
  };

  // Remove Friend Handler
  const handleRemoveFriend = async (friendId, username) => {
    if (!confirm(`Are you sure you want to remove @${username} from your friends?`)) return;
    try {
      await api.delete(`/social/friends/${friendId}`);
      toast.success(`Removed @${username}`);
      loadFriendsData();
    } catch (e) {
      toast.error("Failed to remove friend.");
    }
  };

  // Start DM with Friend
  const startDirectMessage = async (friend) => {
    try {
      const { data } = await api.post("/social/channels", {
        name: stripEffectSyntax(friend.display_name || friend.username),
        is_group: false,
        member_ids: [friend.id],
        icon_url: friend.avatar_url,
      });
      await loadChannels();
      setActiveChannel(data);
      setActiveTab("chat");
    } catch (e) {
      toast.error("Could not start direct message.");
    }
  };

  // Create Group Chat
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (groupMembersMode && (!groupActionChannel?.id || selectedGroupMembers.length === 0)) return;
    if (!groupMembersMode && !groupName.trim()) return;
    setCreatingGroup(true);
    try {
      if (groupMembersMode) {
        const { data } = await api.post(`/social/channels/${groupActionChannel.id}/members`, { member_ids: selectedGroupMembers });
        const updated = { ...groupActionChannel, members: data.members };
        setChannels((current) => current.map((channel) => channel.id === updated.id ? updated : channel));
        if (activeChannel?.id === updated.id) setActiveChannel(updated);
        toast.success("Friends added to the group.");
        setSelectedGroupMembers([]);
        setShowCreateGroupModal(false);
        setGroupMembersMode(false);
        setGroupActionChannel(null);
        return;
      }
      const { data } = await api.post("/social/channels", {
        name: groupName.trim(),
        is_group: true,
        member_ids: selectedGroupMembers,
      });
      toast.success(`Created group "${data.name}"`);
      setGroupName("");
      setSelectedGroupMembers([]);
      setShowCreateGroupModal(false);
      setGroupMembersMode(false);
      await loadChannels();
      setActiveChannel(data);
    } catch (e) {
      toast.error("Failed to create group.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (channel) => {
    setContextMenu(null);
    try {
      await api.delete(`/social/channels/${channel.id}`);
      setChannels((current) => current.filter((item) => item.id !== channel.id));
      if (activeChannel?.id === channel.id) setActiveChannel(null);
      toast.success(`Deleted "${channel.name}".`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete this group.");
    }
  };

  const handleDeleteMessage = async (message) => {
    setContextMenu(null);
    try {
      await api.delete(`/social/channels/${message.channel_id}/messages/${message.id}`);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete this message.");
    }
  };

  // Send Message
  const handleSendMessage = async (customMedia = null, mediaType = null) => {
    if (!activeChannel?.id) return;
    const channelId = activeChannel.id;
    const content = msgInput.trim();
    if (!content && !customMedia) return;

    let finalContent = content;
    if (selectedEffect !== "none" && content) {
      finalContent = `:${selectedEffect}:${content}:${selectedEffect}:`;
    }

    try {
      const payload = {
        content: finalContent,
        media_url: customMedia,
        media_type: mediaType,
        text_effect: selectedEffect !== "none" ? selectedEffect : null,
      };
      setMsgInput("");
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      const { data } = await api.post(`/social/channels/${channelId}/messages`, payload);
      if (activeMessagesChannelIdRef.current === channelId) {
        shouldAutoScrollRef.current = true;
        setMessages((prev) => [...prev, data]);
      }
    } catch (e) {
      toast.error("Failed to send message.");
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await handleSendMessage(data.url, "image");
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error("Failed to upload image.");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const totalIncoming = incomingRequests.length;

  return (
    <div className="space-y-6" onClick={() => contextMenu && setContextMenu(null)}>
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl swat-glass border border-[#4A6B8A]/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <Users size={20} />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-black text-white">Social & Friends</h1>
              <p className="text-xs text-[#E5E7EB]/60">Real member requests, direct chat, and group channel creation.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-black/40 border border-white/10 p-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "chat" ? "bg-[#5B8DB8] text-white shadow-lg" : "text-[#E5E7EB]/60 hover:text-white"
              }`}
            >
              <MessageSquare size={13} />
              <span>Channels & Chat</span>
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                activeTab === "friends" ? "bg-[#5B8DB8] text-white shadow-lg" : "text-[#E5E7EB]/60 hover:text-white"
              }`}
            >
              <Users size={13} />
              <span>Friends ({friends.length})</span>
              {totalIncoming > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {totalIncoming}
                </span>
              )}
            </button>
          </div>

          <Button
            onClick={() => setShowAddFriendModal(true)}
            className="rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs h-9 gap-1.5 shadow-md"
          >
            <UserPlus size={14} /> Add Friend
          </Button>
        </div>
      </div>

      {/* TAB 1: REAL CHANNELS & CHAT WINDOW */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 gap-5 min-h-[460px] h-[min(68dvh,650px)] lg:grid-cols-12">
          {/* Channels Sidebar */}
          <div className="lg:col-span-4 rounded-3xl swat-glass border border-[#4A6B8A]/30 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-[#E5E7EB]/70 flex items-center gap-1.5">
                <Hash size={14} className="text-[#5B8DB8]" /> Channels ({channels.length})
              </div>
              <button
                onClick={() => { setGroupMembersMode(false); setGroupActionChannel(null); setShowCreateGroupModal(true); }}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-[#5B8DB8] flex items-center justify-center transition-all"
                title="Create Group Chat"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {channelsError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="text-xs text-red-200/75">{channelsError}</p>
                  <Button size="sm" variant="outline" onClick={loadChannels} className="border-white/15 text-xs">Try again</Button>
                </div>
              ) : channels.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare size={28} className="text-[#E5E7EB]/20 mb-2" />
                  <div className="text-xs font-semibold text-[#E5E7EB]/60">No conversations yet</div>
                  <div className="text-[11px] text-[#E5E7EB]/40 mt-1">Accept friend requests or start a group chat above.</div>
                </div>
              ) : (
                channels.map((ch) => {
                  const isSelected = activeChannel?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannel(ch)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setContextMenu({ x: event.clientX, y: event.clientY, channel: ch });
                      }}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all border ${
                        isSelected
                          ? "bg-[#5B8DB8]/20 border-[#5B8DB8]/50 shadow-md text-white"
                          : "bg-white/[0.02] border-transparent hover:bg-white/[0.06] text-[#E5E7EB]/80"
                      }`}
                    >
                      {ch.icon_url ? (
                        <img src={ch.icon_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/30 text-[#5B8DB8] flex items-center justify-center shrink-0">
                          {ch.is_group ? <Users size={18} /> : <MessageSquare size={18} />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold truncate text-white">{ch.name}</div>
                          <span className="text-[9px] text-[#E5E7EB]/40">{ch.is_group ? "Group" : "Direct"}</span>
                        </div>
                        <div className="text-[11px] text-[#E5E7EB]/50 truncate mt-0.5">
                          {ch.last_message?.content ? renderBioText(ch.last_message.content) : "No messages yet"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Conversation Feed */}
          <div className="lg:col-span-8 rounded-3xl swat-glass border border-[#4A6B8A]/30 flex flex-col overflow-hidden">
            {activeChannel ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-3">
                    {activeChannel.icon_url ? (
                      <img src={activeChannel.icon_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[#5B8DB8]/20 text-[#5B8DB8] flex items-center justify-center">
                        {activeChannel.is_group ? <Users size={16} /> : <MessageSquare size={16} />}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{activeChannel.name}</span>
                        {activeChannel.is_group && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B8DB8]/20 text-[#5B8DB8] border border-[#5B8DB8]/30 font-normal">
                            {activeChannel.members?.length || 1} members
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/45 flex items-center gap-1 font-mono">
                        {activeChannel.is_group ? "Group conversation" : "Direct conversation"} · messages refresh automatically
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div ref={messagesContainerRef} onScroll={updateAutoScroll} className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3.5">
                  {messagesError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <p className="text-xs text-red-200/75">{messagesError}</p>
                      <Button size="sm" variant="outline" onClick={() => loadMessages(activeChannel.id)} className="border-white/15 text-xs">Try again</Button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#E5E7EB]/40">
                      <Sparkles size={32} className="text-[#5B8DB8]/40 mb-2 animate-bounce" />
                      <div className="text-sm font-semibold text-white">Start the conversation</div>
                      <div className="text-xs text-[#E5E7EB]/60 mt-1">Send a message, GIFs, emojis, or media with text effects!</div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} onContextMenu={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setContextMenu({ x: event.clientX, y: event.clientY, message: m });
                        }} className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          <MediaDisplay
                            src={m.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.sender_id}`}
                            alt="Message sender"
                            className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                          <div className={`max-w-[75%] ${isMe ? "text-right" : "text-left"}`}>
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[11px] font-bold text-white/90">{renderBioText(m.sender?.display_name || m.sender?.username)}</span>
                              <span className="text-[9px] font-mono text-[#E5E7EB]/40">
                                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isMe && <span className="text-[9px] text-[#5B8DB8]/80">{(m.read_by || []).some((readerId) => readerId !== user?.id) ? "Read" : "Sent"}</span>}
                            </div>

                            <div
                              className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed inline-block shadow-md backdrop-blur-md ${
                                isMe
                                  ? "bg-[#5B8DB8] text-white rounded-tr-none"
                                  : "bg-white/[0.06] border border-white/10 text-[#E5E7EB] rounded-tl-none"
                              }`}
                            >
                              {m.content && <div>{renderBioText(m.content)}</div>}
                              {m.content && <SharedProfilePreview content={m.content} />}
                              {m.media_url && m.media_type === "image" && (
                                <img src={fileUrl(m.media_url)} alt="" className="mt-2 rounded-xl max-h-56 object-cover border border-white/15" />
                              )}
                              {m.media_url && m.media_type === "gif" && (
                                <img src={m.media_url} alt="" className="mt-2 rounded-xl max-h-56 object-cover border border-white/15" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar & Actions */}
                <div className="p-3 border-t border-white/10 bg-black/30 space-y-2">
                  {/* Style pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[10px] uppercase font-bold text-[#E5E7EB]/50 shrink-0 mr-1">Effect:</span>
                    {TEXT_EFFECTS.map((eff) => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => setSelectedEffect(eff.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide transition-all shrink-0 ${
                          selectedEffect === eff.id
                            ? "bg-[#5B8DB8] text-white shadow-md"
                            : "bg-white/5 text-[#E5E7EB]/60 hover:bg-white/10"
                        }`}
                      >
                        {eff.label}
                      </button>
                    ))}
                  </div>

                  {/* Emoji & GIF Popups */}
                  {showEmojiPicker && (
                    <div className="p-2.5 rounded-2xl bg-[#0b0e14] border border-[#5B8DB8]/40 grid grid-cols-9 gap-1 shadow-2xl animate-in zoom-in-95 duration-150">
                      {EMOJI_LIST.map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => { setMsgInput((v) => v + emo); }}
                          className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-base active:scale-95"
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  )}

                  {showGifPicker && (
                    <div className="p-2.5 rounded-2xl bg-[#0b0e14] border border-[#5B8DB8]/40 grid grid-cols-3 gap-2 shadow-2xl animate-in zoom-in-95 duration-150 max-h-48 overflow-y-auto">
                      {POPULAR_GIFS.map((gif) => (
                        <button
                          key={gif.title}
                          type="button"
                          onClick={() => handleSendMessage(gif.url, "gif")}
                          className="rounded-xl overflow-hidden border border-white/10 hover:border-[#5B8DB8] transition-all group relative"
                        >
                          <img src={gif.url} alt="" className="w-full h-16 object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] font-bold text-white text-center py-0.5">
                            {gif.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-[#E5E7EB]/70 hover:text-white flex items-center justify-center transition-all shrink-0"
                      title="Upload Image"
                    >
                      <Image size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowGifPicker((g) => !g); setShowEmojiPicker(false); }}
                      className={`px-2 h-9 rounded-xl border text-[11px] font-bold transition-all shrink-0 ${
                        showGifPicker ? "bg-[#5B8DB8] text-white border-[#5B8DB8]" : "bg-white/5 border-white/10 text-[#E5E7EB]/70 hover:text-white"
                      }`}
                    >
                      GIF
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowEmojiPicker((e) => !e); setShowGifPicker(false); }}
                      className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-[#E5E7EB]/70 hover:text-white flex items-center justify-center transition-all shrink-0"
                      title="Emojis"
                    >
                      <Smile size={16} />
                    </button>

                    <Input
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      placeholder={selectedEffect !== "none" ? `Type message with ${selectedEffect} effect...` : "Type a message..."}
                      className="flex-1 bg-black/40 border-white/15 rounded-xl text-white placeholder:text-white/30 h-10 text-xs sm:text-sm"
                    />

                    <Button
                      type="submit"
                      disabled={!msgInput.trim()}
                      className="h-10 px-4 rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white shrink-0 shadow-lg"
                    >
                      <Send size={15} />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <MessageSquare size={40} className="text-[#5B8DB8]/30 mb-3" />
                <div className="text-base font-bold text-white">Select a channel to start chatting</div>
                <div className="text-xs text-[#E5E7EB]/50 mt-1 max-w-sm">Choose an existing conversation or add new aliases to your friends list.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REAL FRIENDS LIST & REQUESTS */}
      {activeTab === "friends" && (
        <div className="rounded-3xl swat-glass border border-[#4A6B8A]/30 p-6 space-y-6">
          {friendsError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-300/15 bg-red-950/20 px-3 py-2">
              <span className="text-xs text-red-100/75">{friendsError}</span>
              <Button size="sm" variant="outline" onClick={loadFriendsData} className="h-8 border-white/15 text-xs">Try again</Button>
            </div>
          )}
          {/* Subtabs for All Friends vs Requests */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex rounded-xl bg-black/40 border border-white/10 p-1">
              <button
                onClick={() => setFriendsSubTab("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  friendsSubTab === "all" ? "bg-[#5B8DB8] text-white shadow-md" : "text-[#E5E7EB]/60 hover:text-white"
                }`}
              >
                All Friends ({friends.length})
              </button>
              <button
                onClick={() => setFriendsSubTab("incoming")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  friendsSubTab === "incoming" ? "bg-[#5B8DB8] text-white shadow-md" : "text-[#E5E7EB]/60 hover:text-white"
                }`}
              >
                <span>Incoming</span>
                {incomingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFriendsSubTab("outgoing")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  friendsSubTab === "outgoing" ? "bg-[#5B8DB8] text-white shadow-md" : "text-[#E5E7EB]/60 hover:text-white"
                }`}
              >
                Pending Outgoing ({outgoingRequests.length})
              </button>
            </div>

            <Button
              onClick={() => setShowAddFriendModal(true)}
              className="rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs h-9 gap-1.5 shadow-md"
            >
              <UserPlus size={14} /> Send Friend Request
            </Button>
          </div>

          {/* 1. ALL ACCEPTED FRIENDS */}
          {friendsSubTab === "all" && (
            <div>
              {friendsLoading ? (
                <div className="py-16 text-center text-xs text-white/45">Loading friends...</div>
              ) : friends.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={44} className="text-[#5B8DB8]/30 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No friends in your list yet</h3>
                  <p className="text-xs text-[#E5E7EB]/50 mt-1 max-w-md mx-auto">
                    Send friend requests to other registered creators by their alias (e.g. <code>swats</code>). Once they accept, you can message them directly.
                  </p>
                  <Button
                    onClick={() => setShowAddFriendModal(true)}
                    className="mt-4 rounded-xl bg-[#5B8DB8] text-white text-xs"
                  >
                    Send Friend Request
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((f) => (
                    <div
                      key={f.id}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setContextMenu({ x: event.clientX, y: event.clientY, friend: f });
                      }}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#5B8DB8]/50 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <MediaDisplay src={f.avatar_url} alt={`${f.username} profile picture`} className="w-12 h-12 rounded-2xl object-cover border border-white/15 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate">{renderBioText(f.display_name || f.username)}</div>
                          <div className="text-xs text-[#5B8DB8] font-mono">@{f.username}</div>
                          {f.description && (
                            <div className="text-[11px] text-[#E5E7EB]/60 line-clamp-1 mt-1">
                              {renderBioText(f.description)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <Button
                          onClick={() => startDirectMessage(f)}
                          size="sm"
                          className="flex-1 rounded-xl bg-[#5B8DB8]/20 hover:bg-[#5B8DB8] text-[#5B8DB8] hover:text-white border border-[#5B8DB8]/30 text-xs h-8 gap-1.5 transition-all"
                        >
                          <MessageSquare size={13} /> Message
                        </Button>
                        <button
                          onClick={() => handleRemoveFriend(f.id, f.username)}
                          className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all"
                          title="Remove friend"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. INCOMING FRIEND REQUESTS (ACCEPT / DECLINE) */}
          {friendsSubTab === "incoming" && (
            <div>
              {incomingRequests.length === 0 ? (
                <div className="text-center py-16">
                  <UserCheck size={40} className="text-[#5B8DB8]/30 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No incoming friend requests</h3>
                  <p className="text-xs text-[#E5E7EB]/50 mt-1">When someone sends you a friend request, it will appear here for you to accept.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.request_id}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-[#5B8DB8]/40 shadow-lg flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3">
                          <MediaDisplay src={req.avatar_url} alt={`${req.username} profile picture`} className="w-12 h-12 rounded-2xl object-cover border border-white/15 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate">{renderBioText(req.display_name || req.username)}</div>
                          <div className="text-xs text-[#5B8DB8] font-mono">@{req.username}</div>
                          <div className="text-[10px] text-[#E5E7EB]/40 mt-1 flex items-center gap-1">
                            <Clock size={11} /> Sent {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <Button
                          onClick={() => handleAcceptRequest(req.id, req.username)}
                          size="sm"
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 gap-1.5 shadow-md"
                        >
                          <Check size={13} /> Accept
                        </Button>
                        <Button
                          onClick={() => handleDeclineRequest(req.id, req.username)}
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-white/20 text-xs text-red-400 hover:bg-red-500/10 h-8 gap-1"
                        >
                          <X size={13} /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. OUTGOING PENDING REQUESTS */}
          {friendsSubTab === "outgoing" && (
            <div>
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={40} className="text-[#5B8DB8]/30 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No outgoing pending requests</h3>
                  <p className="text-xs text-[#E5E7EB]/50 mt-1">You haven't sent any pending requests waiting for approval.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.request_id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3">
                          <MediaDisplay src={req.avatar_url} alt={`${req.username} profile picture`} className="w-12 h-12 rounded-2xl object-cover border border-white/15 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate">{renderBioText(req.display_name || req.username)}</div>
                          <div className="text-xs text-[#5B8DB8] font-mono">@{req.username}</div>
                          <div className="text-[10px] text-amber-400 font-mono mt-1 flex items-center gap-1">
                            <Clock size={11} className="animate-spin" /> Waiting for acceptance...
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <Button
                          onClick={() => handleDeclineRequest(req.id, req.username)}
                          size="sm"
                          variant="outline"
                          className="w-full rounded-xl border-white/20 text-xs text-[#E5E7EB]/60 hover:text-red-400 h-8 gap-1"
                        >
                          <X size={13} /> Cancel Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {contextMenu && (
        <div
          role="menu"
          className="fixed z-[100] min-w-48 rounded-lg border border-white/15 bg-[#111419] p-1.5 shadow-2xl"
          style={{ left: Math.max(8, Math.min(contextMenu.x, window.innerWidth - 210)), top: Math.max(8, Math.min(contextMenu.y, window.innerHeight - 110)) }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="truncate px-2 py-1.5 text-[10px] font-semibold uppercase text-white/45">{contextMenu.channel?.name || (contextMenu.friend ? `@${contextMenu.friend.username}` : `Message · @${contextMenu.message?.sender?.username || "member"}`)}</div>
          {contextMenu.message && <button type="button" role="menuitem" onClick={() => {
            const message = contextMenu.message;
            navigator.clipboard.writeText(message.content || message.media_url || "");
            setContextMenu(null);
            toast.success("Message copied.");
          }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-white/80 hover:bg-white/10"><Copy size={14} /> Copy message</button>}
          {contextMenu.message?.sender_id === user?.id && <button type="button" role="menuitem" onClick={() => handleDeleteMessage(contextMenu.message)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"><Trash2 size={14} /> Delete message</button>}
          {contextMenu.friend && <button type="button" role="menuitem" onClick={() => {
            const friend = contextMenu.friend;
            setContextMenu(null);
            startDirectMessage(friend);
          }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-white/80 hover:bg-white/10"><MessageSquare size={14} /> Message</button>}
          {contextMenu.friend && <button type="button" role="menuitem" onClick={() => {
            const friend = contextMenu.friend;
            setContextMenu(null);
            handleRemoveFriend(friend.id, friend.username);
          }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"><Trash2 size={14} /> Remove friend</button>}
          {contextMenu.channel?.is_group && <button type="button" role="menuitem" onClick={() => {
            setGroupActionChannel(contextMenu.channel);
            setSelectedGroupMembers([]);
            setGroupMembersMode(true);
            setContextMenu(null);
            setShowCreateGroupModal(true);
          }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-white/80 hover:bg-white/10"><UserPlus size={14} /> Add members</button>}
          {contextMenu.channel?.is_group && contextMenu.channel.owner_id === user?.id && <button type="button" role="menuitem" onClick={() => handleDeleteGroup(contextMenu.channel)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"><Trash2 size={14} /> Delete group chat</button>}
        </div>
      )}

      {/* MODAL: SEND FRIEND REQUEST */}
      <Dialog open={showAddFriendModal} onOpenChange={setShowAddFriendModal}>
        <DialogContent className="swat-glass border-[#4A6B8A]/40 text-[#E5E7EB] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <UserPlus size={18} className="text-[#5B8DB8]" /> Send Friend Request
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendFriendRequest} className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-[#E5E7EB]/70 font-medium mb-1 block">Username / Alias</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono">@</span>
                <Input
                  value={addFriendUsername}
                  onChange={(e) => setAddFriendUsername(e.target.value)}
                  placeholder="username"
                  className="pl-8 bg-black/40 border-white/20 text-white rounded-xl"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-[#E5E7EB]/40 mt-1.5">Enter the exact alias of the user. A friend request will be sent to them to accept.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddFriendModal(false)} className="rounded-xl border-white/20 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={addingFriend || !addFriendUsername.trim()} className="rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs">
                {addingFriend ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CREATE GROUP CHAT */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent className="swat-glass border-[#4A6B8A]/40 text-[#E5E7EB] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Users size={18} className="text-[#5B8DB8]" /> {groupMembersMode ? "Add Group Members" : "Create Group Channel"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
            {!groupMembersMode && <div>
              <label className="text-xs text-[#E5E7EB]/70 font-medium mb-1 block">Group Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Swats Squad"
                className="bg-black/40 border-white/20 text-white rounded-xl"
                autoFocus
              />
            </div>}

            <div>
              <label className="text-xs text-[#E5E7EB]/70 font-medium mb-1.5 block">{groupMembersMode ? "Select friends to add" : "Select Friends to Invite"}</label>
              {friends.filter((friend) => !groupMembersMode || !groupActionChannel?.members?.includes(friend.id)).length === 0 ? (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#E5E7EB]/50 text-center">
                  {groupMembersMode ? "All your friends are already in this group." : "You don't have any accepted friends yet to invite. Add friends first!"}
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 p-1">
                  {friends.filter((friend) => !groupMembersMode || !groupActionChannel?.members?.includes(friend.id)).map((f) => {
                    const isChecked = selectedGroupMembers.includes(f.id);
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          setSelectedGroupMembers((prev) =>
                            isChecked ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                          );
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? "bg-[#5B8DB8]/20 border-[#5B8DB8]" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MediaDisplay src={f.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          <div className="text-xs font-semibold text-white">{renderBioText(f.display_name || f.username)} (@{f.username})</div>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? "bg-[#5B8DB8] border-[#5B8DB8] text-white" : "border-white/20"}`}>
                          {isChecked && <Check size={13} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreateGroupModal(false); setGroupMembersMode(false); setGroupActionChannel(null); }} className="rounded-xl border-white/20 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={creatingGroup || (groupMembersMode ? selectedGroupMembers.length === 0 : !groupName.trim())} className="rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs">
                {creatingGroup ? "Working..." : groupMembersMode ? "Add Members" : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
