import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import MyProducts from './components/MyProducts';
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  return (
    <>
   <Router>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        style={{ zIndex: 9999 }}
      />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-products"
          element={
            <ProtectedRoute>
              <MyProducts />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>

    </>
  );
};

export default App;