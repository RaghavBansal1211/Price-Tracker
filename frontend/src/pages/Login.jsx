import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await API.post('/users/login', data);
      localStorage.setItem('token', res.data.token);
      toast.success('Login successful!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors px-4">
      <ToastContainer />
      <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-black dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            placeholder="Email"
            className="w-full mb-3 p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}

          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            placeholder="Password"
            className="w-full mb-4 p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          />
          {errors.password && <p className="text-red-500">{errors.password.message}</p>}

          <button
            type="submit"
            className={`w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
