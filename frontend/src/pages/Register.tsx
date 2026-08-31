import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Logo } from '../components/common/Logo';
import { DemoRoleSwitcher } from '../components/common/DemoRoleSwitcher';

export const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="mb-6 text-center">
        <Logo size="lg" />
      </div>
      <RegisterForm />
      <DemoRoleSwitcher />
    </div>
  );
};
