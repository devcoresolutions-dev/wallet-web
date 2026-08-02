import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      {/* Header / Navbar pública irá aquí */}
      <main>
        <Outlet />
      </main>
      {/* Footer público irá aquí */}
    </div>
  );
};

export default PublicLayout;
