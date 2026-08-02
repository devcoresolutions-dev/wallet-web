import React from 'react';
import { Outlet } from 'react-router-dom';

export const ProtectedLayout: React.FC = () => {
  return (
    <div className="protected-layout">
      {/* Sidebar y Topbar de la aplicación irán aquí */}
      <main>
        <Outlet />
      </main>
      {/* Widget flotante del chatbot Gemini irá disponible aquí */}
    </div>
  );
};

export default ProtectedLayout;
