import React, { useState } from 'react';
import InternSideBar from "../InternSideBar";
import TabsBar from '../components/WorksPage/TabsBar';
import ChatTab from '../components/WorksPage/ChatTab/ChatTab';
import '../../CssFiles/Projects/Projects.css';
import FeedBackTab from '../components/WorksPage/FeedBackTab/FeedBackTab';
import UploadTab from '../components/WorksPage/UploadTab/UploadTab';

const WorksPage = () => {
  const [activeTab, setActiveTab] = useState('televerser');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-dashboard">
      <InternSideBar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <div className="content-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <h1>Thème:</h1>
          <h3>Mise en place d'une application web de suivi des actions R& D a Bcef Ingenierie Informatique</h3>
        </div>

        {/* 🔹 Tabs déplacés ici */}
        <TabsBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="tab-content-container">
          {activeTab === 'televerser' && <UploadTab/>}
          {activeTab === 'feedback' && <FeedBackTab/> }
          {activeTab === 'chatroom' && <ChatTab/>}
        </div>
      </div>
    </div>
  );
};

export default WorksPage;
