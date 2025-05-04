
import React from "react";
import MainLayout from "@/components/Layout/MainLayout";
import AccountSettings from "@/components/Auth/AccountSettings";

const Account = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-8 text-center">Account Settings</h1>
        <AccountSettings />
      </div>
    </MainLayout>
  );
};

export default Account;
