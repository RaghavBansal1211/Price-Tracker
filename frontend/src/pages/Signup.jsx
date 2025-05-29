import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const onSendOtp = async (data) => {
    setSendingOtp(true);
    try {
      const response = await API.post('/users/send-otp', data);
      setEmail(data.email);
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const onVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      const res = await API.post('/users/verify-otp', { email, code: otp });
      if (res.data.success) {
        toast.success('Signup successful!');
        setTimeout(() => (window.location.href = '/login'), 1500);
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error('OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          Create Your Account
        </h2>

        {!otpSent ? (
          <form onSubmit={handleSubmit(onSendOtp)}>
            <div className="mb-4">
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="Full Name"
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="mb-4">
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^@]+@[^@]+\.[^@]+$/,
                    message: 'Invalid email format',
                  },
                })}
                type="email"
                placeholder="Email"
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="mb-4 relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full p-3 pr-10 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-sm text-blue-600 dark:text-blue-400"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className={`w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 ${
                sendingOtp ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {sendingOtp ? 'Sending OTP...' : 'Sign Up'}
            </button>

            <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Login
              </Link>
            </p>
          </form>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={onVerifyOtp}
              disabled={verifyingOtp}
              className={`w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 mb-3 ${
                verifyingOtp ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify OTP & Sign Up'}
            </button>

            <button
              onClick={handleSubmit(onSendOtp)}
              disabled={sendingOtp}
              className={`w-full bg-gray-300 text-black dark:bg-gray-700 dark:text-white py-3 rounded hover:bg-gray-400 dark:hover:bg-gray-600 ${
                sendingOtp ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {sendingOtp ? 'Resending...' : 'Resend OTP'}
            </button>

            <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
