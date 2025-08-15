"use client";

import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('../app/login/login-form'), {
  ssr: false,
});

const ClientLoginForm = () => {
  return <LoginForm />;
};

export default ClientLoginForm;