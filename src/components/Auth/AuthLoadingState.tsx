
import React from "react";
import { Loader } from "lucide-react";

const AuthLoadingState = () => {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center">
        <Loader className="h-8 w-8 animate-spin text-teal-500 mb-2" />
        <p className="text-gray-600">Checking authentication status...</p>
      </div>
    </div>
  );
};

export default AuthLoadingState;
