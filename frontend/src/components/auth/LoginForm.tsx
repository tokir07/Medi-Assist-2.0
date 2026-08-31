import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../common/Alert';
import { SocialLogin } from './SocialLogin';
import { User as UserIcon, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if redirected from logout or expired session
  const logoutMessage = (location.state as any)?.message;
  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setValidationError('Please enter your email or username.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const userRole = await login(cleanIdentifier, password);
      if (userRole === 'DOCTOR') {
        navigate('/doctor');
      } else if (userRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/patient');
      }
    } catch (err: any) {
      // Error is caught and set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    clearError();
    setValidationError(null);
    setLoading(true);

    try {
      const userRole = await loginWithGoogle();
      if (userRole === 'DOCTOR') {
        navigate('/doctor');
      } else if (userRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/patient');
      }
    } catch (err: any) {
      // Error set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] mx-auto">
      {/* Messages */}
      {logoutMessage && <div className="mb-4"><Alert type="success" message={logoutMessage} /></div>}
      {isExpired && (
        <div className="mb-4">
          <Alert type="warning" message="Your security session expired. Please sign in again." />
        </div>
      )}
      {validationError && (
        <div className="mb-4">
          <Alert type="error" message={validationError} onClose={() => setValidationError(null)} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={clearError} />
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/90 p-7 sm:p-9 shadow-[0_10px_35px_rgba(16,42,86,0.06)] animate-fade-in">
        {/* Header */}
        <div className="text-center mb-7">
          <h2 className="text-2xl sm:text-[28px] font-bold text-[#102A56] tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-[#5F6F86] mt-1.5 font-normal">
            Login to your MediAssist account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Email or Username */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#102A56] mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A98AA]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                disabled={loading}
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] placeholder:text-[#9AA7B8] focus:outline-none focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#102A56] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A98AA]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-white border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] placeholder:text-[#9AA7B8] focus:outline-none focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A98AA] hover:text-[#5F6F86] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#D9E1EA] text-[#0FA3A3] focus:ring-[#0FA3A3]/20 accent-[#0FA3A3] cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-[#5F6F86]">Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-xs sm:text-sm font-medium text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Primary Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 px-5 bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0B7A7A] text-white font-semibold text-sm sm:text-base rounded-xl shadow-[0_4px_14px_rgba(15,163,163,0.25)] hover:shadow-[0_6px_18px_rgba(15,163,163,0.35)] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E7EDF4]"></div>
          </div>
          <span className="relative px-3 bg-white text-xs text-[#8A98AA] font-normal">
            or continue with
          </span>
        </div>

        {/* Google Social Authentication (No Microsoft) */}
        <SocialLogin onGoogleClick={handleGoogleAuth} disabled={loading} />

        {/* Sign up prompt */}
        <div className="mt-6 text-center text-xs sm:text-sm text-[#5F6F86]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
