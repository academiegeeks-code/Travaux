import React from "react";
import {
    Upload as UploadIcon,
    Chat as ChatIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import "../../../CssFiles/Projects/Projects.css";

const TabsBar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-button ${activeTab === "televerser" ? "active" : ""}`}
        onClick={() => setActiveTab("televerser")}
      >
        <UploadIcon sx={{ fontSize: 24, color: 'green'}}/>
        <span className="tab-label">Téléverser</span>
      </button>

      <button
        className={`tab-button ${activeTab === "feedback" ? "active" : ""}`}
        onClick={() => setActiveTab("feedback")}
      >
        <DownloadIcon sx={{ fontSize: 24, color: 'green'}}/>
        <span className="tab-label">FeedBack </span>
      </button>

      <button
        className={`tab-button ${activeTab === "chatroom" ? "active" : ""}`}
        onClick={() => setActiveTab("chatroom")}
      >
        <ChatIcon sx={{ fontSize: 24, color: 'green'}}/>
        <span className="tab-label">Chatroom</span>
      </button>
    </div>
  );
};

export default TabsBar;
