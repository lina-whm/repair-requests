import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import CreateRequest from './pages/CreateRequest';
import DispatcherPanel from './pages/DispatcherPanel'; 
import MasterPanel from './pages/MasterPanel'; 
import './App.css';

function App() {
  const [role, setRole] = useState<'dispatcher' | 'master' | null>(null);

  if (!role) {
    return (
      <div className="login-screen">
        <h1>Выберите роль</h1>
        <button onClick={() => setRole('dispatcher')}>Диспетчер</button>
        <button onClick={() => setRole('master')}>Мастер</button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="main-nav">
          <Link to="/">Создать заявку</Link>
          {role === 'dispatcher' && (
            <Link to="/dispatcher">Панель диспетчера</Link>
          )}
          {role === 'master' && (
            <Link to="/master">Панель мастера</Link>
          )}
          <button onClick={() => setRole(null)}>Сменить роль</button>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<CreateRequest />} />
            {role === 'dispatcher' && (
              <Route path="/dispatcher" element={<DispatcherPanel />} />
            )}
            {role === 'master' && (
              <Route path="/master" element={<MasterPanel />} />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;