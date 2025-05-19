
import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
};

export default AuthHeader;
