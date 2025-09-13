import React, { useState } from "react";
import AdminSidebar from "./AdminSection/AdminSideBar";
import DashBoardView from "./AdminSection/DashBoardView";
import { Box } from "@mui/material";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: "flex" }}>
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <DashBoardView />
    </Box>
  );
}
