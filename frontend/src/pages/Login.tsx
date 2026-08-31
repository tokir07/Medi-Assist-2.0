import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { HealthcareIllustration } from '../components/auth/HealthcareIllustration';
import { FeatureHighlights } from '../components/auth/FeatureHighlights';
import { FooterLinks } from '../components/layout/FooterLinks';
import { HelpCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7FAFF] flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#EEF5FF] blur-3xl opacity-70"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#EBF4FE] blur-3xl opacity-60"></div>
      </div>

      {/* Main Two-Column Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 items-center px-4 sm:px-8 lg:px-12 py-8 lg:py-6 gap-8 lg:gap-12">
        {/* Left Column: Brand, Story, Illustration & Feature Badges */}
        <div className="lg:col-span-6 flex flex-col justify-between h-full py-4 lg:py-8 space-y-6 lg:space-y-8">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="MediAssist Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <span className="font-extrabold text-2xl sm:text-[26px] tracking-tight text-[#102A56]">
              Medi<span className="text-[#0FA3A3]">Assist</span>
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="max-w-lg space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#102A56] tracking-tight leading-[1.15]">
              Your Health,<br />
              <span className="text-[#102A56]">Our Priority</span>
            </h1>
            <p className="text-sm sm:text-base text-[#5F6F86] leading-relaxed pt-1 max-w-md">
              MediAssist helps you manage your medical records, connect with AI and take control of your health.
            </p>
          </div>

          {/* Healthcare Vector Illustration */}
          <div className="flex items-center justify-center py-2 sm:py-4">
            <HealthcareIllustration className="max-w-[420px]" />
          </div>

          {/* 3 Bottom Feature Highlights */}
          <div className="max-w-lg pt-2">
            <FeatureHighlights />
          </div>
        </div>

        {/* Right Column: Top Need Help, Login Card & Footer */}
        <div className="lg:col-span-6 flex flex-col justify-between h-full py-4 lg:py-8 items-center lg:items-end">
          {/* Top Bar: Need help link */}
          <div className="w-full flex justify-end items-center mb-4 lg:mb-2">
            <a
              href="mailto:support@mediassist.health"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#5F6F86] hover:text-[#102A56] bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-[#D9E1EA]/60 shadow-xs transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#0FA3A3]" />
              <span>Need help?</span>
            </a>
          </div>

          {/* Main Login Card */}
          <div className="w-full my-auto flex justify-center lg:justify-end">
            <LoginForm />
          </div>

          {/* Bottom Footer Links */}
          <div className="w-full pt-8 lg:pt-6 flex justify-center lg:justify-end">
            <FooterLinks />
          </div>
        </div>
      </div>
    </div>
  );
};
