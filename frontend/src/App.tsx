import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { DashboardPage } from './pages/DashboardPage';
import { WizardPage } from './pages/WizardPage';
import { IdePage } from './pages/IdePage';
import { GuardianPage } from './pages/GuardianPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isIdeView = location.pathname.startsWith('/ide/');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none">
      {/* Show global header except when in deep IDE workspace */}
      {!isIdeView && <Header />}
      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/ide/:projectId" element={<IdePage />} />
          <Route path="/guardian" element={<GuardianPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
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
