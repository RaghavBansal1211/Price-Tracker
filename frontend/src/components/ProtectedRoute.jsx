// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const exp = decoded.exp;
    return Date.now() >= exp * 1000;
  } catch (error) {
    console.error('JWT decode error:', error);
    return true; 
  }
};


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token'); // optional: clean up
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
