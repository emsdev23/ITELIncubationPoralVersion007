// src/components/ChatWindow.jsx
import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import "./ChatWindow.css";

const ChatWindow = ({
  chat,
  messages,
  onSendMessage,
  currentUser,
  fileInputRef,
  activeTab,
}) => {
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setShouldAutoScroll(isAtBottom);
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleSendMessage = (messageContent, attachment) => {
    onSendMessage(messageContent, attachment, replyTo?.chatdetailsrecid);
    setReplyTo(null);
    setShouldAutoScroll(true);
  };

  // --- KEY MODIFICATION: Update Reply Logic ---
  const isBroadcastChat = chat?.chatlistchattypeid === 3;
  const isOriginalSender = currentUser.id === String(chat?.chatlistfrom);
  console.log("user ids",currentUser.id,chat?.chatlistfrom)
  console.log("original sender status",isOriginalSender)
  const isChatClosed = activeTab === "closed" || chat?.chatlistchatstate === 0;
  const canReply = (!isBroadcastChat || isOriginalSender) && !isChatClosed;
  // --- END OF MODIFICATION ---

  if (!chat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h3>Select a chat to start messaging</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{chat.chatlistsubject}</h3>
        <div className="chat-type-info">
          {chat.chatlistchattypeid === 1 && <span>Incubator → Incubatee</span>}
          {chat.chatlistchattypeid === 2 && <span>Incubatee → Incubator</span>}
          {chat.chatlistchattypeid === 3 && <span>Broadcast (No Reply)</span>}
          {chat.chatlistchattypeid === 4 && <span>Group Chat (Public Replies)</span>}
          {chat.chatlistchattypeid === 5 && <span>Group Chat (Private Replies)</span>}
        </div>
        {isBroadcastChat && isOriginalSender && (
          <span className="sender-indicator">You are the broadcaster</span>
        )}
        {isChatClosed && <div className="chat-status-badge closed">Closed</div>}
      </div>

      <div className="messages-container" ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.chatdetailsrecid}
                message={message}
                currentUser={currentUser}
                onReply={canReply ? handleReply : null}
                isPublicReplyChat={chat?.chatlistchattypeid === 4}
                isPrivateReplyChat={chat?.chatlistchattypeid === 5}
                allMessages={messages}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {replyTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span>Replying to {replyTo.chatdetailsfrom === currentUser.id ? "You" : `User ${replyTo.chatdetailsfrom}`}: </span>
            <p>{replyTo.chatdetailsmessage}</p>
          </div>
          <button className="cancel-reply-btn" onClick={handleCancelReply}>×</button>
        </div>
      )}

      {canReply && (
        <MessageInput
          onSendMessage={handleSendMessage}
          fileInputRef={fileInputRef}
          placeholder={isBroadcastChat && isOriginalSender ? "Broadcast a message..." : "Type a message..."}
          disabled={isChatClosed}
        />
      )}

      {!canReply && !isChatClosed && (
         <div className="chat-closed-notice">
          <p>{isBroadcastChat && !isOriginalSender ? "You cannot reply to this broadcast." : "Replies are not allowed in this chat."}</p>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;