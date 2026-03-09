// App.tsx
import React from 'react';
import Navbar from './components/Navbar.tsx';
import RFQTable from './components/RFQTable.tsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';

export default function App() {
  return (
    <div className="App">
      <Navbar />

      <main className="main-content">
        <RFQTable />
      </main>

      {/* Toast container for success / error messages */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
      
    </div>
  );
}
