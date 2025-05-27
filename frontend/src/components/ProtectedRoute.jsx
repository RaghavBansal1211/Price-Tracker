// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // or use your auth context
  return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
