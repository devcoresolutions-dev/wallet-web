import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      {/* Header / Navbar publica iran aquii */}
      <main>
        <Outlet />
      </main>
      {/* Footer publico ira aqui */}
    </div>
  );
};

export default PublicLayout;
