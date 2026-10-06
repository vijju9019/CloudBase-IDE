import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { WizardPage } from './pages/WizardPage';
import { IdePage } from './pages/IdePage';
import { GuardianPage } from './pages/GuardianPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isIdeView = location.pathname.startsWith('/ide/');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FFFFFF] text-[#111827] overflow-hidden select-none font-sans">
      {/* Show SaaS Header across all views except the focused IDE code editor */}
      {!isIdeView && <Header />}

      {/* Main App Body with light Sidebar when in dashboard/management views */}
      <div className="flex-1 flex overflow-hidden relative">
        {!isIdeView && <Sidebar />}

        <main className="flex-1 overflow-hidden relative bg-[#FFFFFF]">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/ide/:projectId" element={<IdePage />} />
            <Route path="/guardian" element={<GuardianPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
