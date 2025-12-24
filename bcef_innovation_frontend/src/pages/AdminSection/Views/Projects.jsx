import React, { useState } from 'react';
import AdminSideBar from "./../AdminSideBar";
import ProjectsTab from '../Components/Projects/ProjectsTab/ProjectsTab';
import FormationsTab from '../Components/Projects/FormationsTab/FormationsTab';
import ThemesTab from '../Components/Projects/ThemeTab/ThemeTab';
import TabsBar from '../Components/Projects/TabsBar';
import '../../CssFiles/Projects/Projects.css';

const Projects = () => {
  const [activeTab, setActiveTab] = useState('projets');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-dashboard">
      <AdminSideBar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>


        {/* 🔹 Tabs déplacés ici */}
        <TabsBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="tab-content-container">
          {activeTab === 'projets' && <ProjectsTab />}
          {activeTab === 'formations' && <FormationsTab />}
          {activeTab === 'themes' && <ThemesTab />}
  {/*s */}       
        </div>
      </div>
    </div>
  );
};

export default Projects;
