// App.tsx
import React from 'react';
import Navbar from './components/Navbar.tsx';
import RFQTable from './components/RFQTable.tsx';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <RFQTable />
      </main>
    </div>
  );
}