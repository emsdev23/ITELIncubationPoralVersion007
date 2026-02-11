import React, { useState } from "react";
import Swal from "sweetalert2";
import "./ChatList.css";
import { IPAdress } from "../Datafetching/IPAdrees";
import api from "../Datafetching/api";

const ChatList = ({
  chatLists,
  selectedChat,
  onSelectChat,
  loading,
  currentUser,
  refreshing,
  onCloseChat,
}) => {
  const [activeTab, setActiveTab] = useState("active");
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incUserid");

  const getChatTypeLabel = (chatTypeId) => {
    const types = {
      1: "Incubator → Incubatee",
      2: "Incubatee → Incubator",
      3: "Broadcast (No Reply)",
      4: "Group Chat (Public)",
      5: "Group Chat (Private)",
    };
    return types[chatTypeId] || "Unknown";
  };

  const getChatPartnerName = (chat) => {
    // 1. Handle Group/Broadcast Chats
    if (chat.chatlistisgroup) {
      const recipientCount = chat.chatlistrecipients ? chat.chatlistrecipients.split(',').length : 0;
      if (chat.chatlistfrom == currentUser.id) {
        return `Broadcast to ${recipientCount} recipients`;
      } else {
        return `Broadcast from ${chat.usersnamefrom || 'Unknown'}`;
      }
    }
    
    // 2. Handle One-to-One Chats
    if (chat.chatlistfrom == currentUser.id) {
      return chat.usernameto || "Unknown";
    }
    return chat.usersnamefrom || "Unknown";
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCloseChat = async (e, chat) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Close Chat",
      text: `Are you sure you want to close this chat with ${getChatPartnerName(chat)}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, close it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    if (!token) {
      Swal.fire({ title: "Authentication Error", text: "Authentication token not found. Please log in again.", icon: "error" });
      return;
    }

    const requestBody = {
      chatdetailsfrom: String(currentUser.id),
      userIncId: String(currentUser.incUserid),
      chatrecid: chat.chatlistrecid,
    };

    Swal.fire({ title: "Closing Chat", text: "Please wait...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const response = await api.post(`${IPAdress}/itelinc/resources/chat/close`, requestBody, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      console.log("Chat closed successfully:", response.data);
      Swal.fire({ title: "Success!", text: "Chat closed successfully!", icon: "success", timer: 2000, showConfirmButton: false });
      if (onCloseChat) onCloseChat(chat);
    } catch (error) {
      console.error("Failed to close chat:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      Swal.fire({ title: "Error", text: `Could not close chat: ${errorMessage}`, icon: "error" });
    }
  };

  if (loading) {
    return (
      <div className="chat-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading chats...</p>
      </div>
    );
  }

  // UPDATED LOGIC: Filter then Sort by modified time (Descending)
  const sortChatsByTime = (a, b) => {
    const dateA = new Date(a.chatlistmodifiedtime).getTime();
    const dateB = new Date(b.chatlistmodifiedtime).getTime();
    return dateB - dateA; // Sort Descending (Newest first)
  };

  const activeChats = chatLists
    .filter((chat) => chat.chatlistchatstate === 1)
    .sort(sortChatsByTime);

  const closedChats = chatLists
    .filter((chat) => chat.chatlistchatstate === 0)
    .sort(sortChatsByTime);

  const chatsToDisplay = activeTab === "active" ? activeChats : closedChats;
  const noChatsMessage = activeTab === "active" ? "No active chats. Start a new conversation!" : "No closed chats.";

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <div className="chat-list-tabs">
          <button className={`tab-button ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>Active</button>
          <button className={`tab-button ${activeTab === "closed" ? "active" : ""}`} onClick={() => setActiveTab("closed")}>Closed</button>
        </div>
        {refreshing && (
          <div className="refresh-indicator">
            <div className="spinner-small"></div>
            <span>Refreshing...</span>
          </div>
        )}
      </div>
      {chatsToDisplay.length === 0 ? (
        <div className="no-chats">{noChatsMessage}</div>
      ) : (
        <ul className="chat-list-items">
          {chatsToDisplay.map((chat) => {
            // UPDATED LOGIC: Check who the user is to determine which read state to check
            let isUnread = false;
            
            if (chat.chatlistfrom == currentUser.id) {
              // If current user is the sender, check fromreadstate
              isUnread = chat.chatlistfromreadstate === 1;
            } else if (chat.chatlistto == currentUser.id) {
              // If current user is the receiver, check toreadstate
              isUnread = chat.chatlisttoreadstate === 1;
            }

            return (
              <li
                key={chat.chatlistrecid}
                className={`chat-list-item 
                  ${selectedChat?.chatlistrecid === chat.chatlistrecid ? "active" : ""} 
                  ${isUnread ? "unread" : ""}`}
                onClick={() => onSelectChat(chat)}
              >
                <div className="chat-item-header">
                  <span className="chat-partner">{chat.chatlistsubject}</span>
                  <div className="chat-item-actions">
                    <span className="chat-time">{formatTime(chat.chatlistmodifiedtime)}</span>
                    {activeTab === "active" && chat.chatlistfrom == currentUser.id && (
                      <button className="close-chat-btn" onClick={(e) => handleCloseChat(e, chat)} title="Close this chat">Close</button>
                    )}
                  </div>
                </div>
                <div className="chat-item-subject">{getChatPartnerName(chat)}</div>
                <div className="chat-type-badge">{getChatTypeLabel(chat.chatlistchattypeid)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChatList;