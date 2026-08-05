import React from 'react';
import { Outlet } from 'react-router-dom';

export const ProtectedLayout: React.FC = () => {
  return (
    <div className="protected-layout">
      {/* Sidebar y Topbar de la aplicacion iran aqui */}
      <main>
        <Outlet />
      </main>
      {/* Widget flotante del chatbot Gemini ira disponible aqui */}
    </div>
  );
};

export default ProtectedLayout;
