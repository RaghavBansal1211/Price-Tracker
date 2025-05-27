import React from 'react';
import HomeContent from '../components/HomeContent';
import 'react-toastify/dist/ReactToastify.css';

const Home = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handleMyProducts = () => {
    console.log('Navigate to My Products (implement separately)');
  };

  return (
    <>
    <br/>
    <HomeContent onLogout={handleLogout} onMyProducts={handleMyProducts} />
    </>
  );
};

export default Home;
