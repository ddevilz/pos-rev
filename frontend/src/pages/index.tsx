import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import NewOrderPage from './NewOrderPage';

// Demo App to showcase the NewOrderPage
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/new-order" element={<NewOrderPage />} />
            <Route path="/" element={<Navigate to="/new-order" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
};

export default App;