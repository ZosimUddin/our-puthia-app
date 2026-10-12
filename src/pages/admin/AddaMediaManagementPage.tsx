import React from 'react';
import AddaMediaManagement from '../../components/admin/AddaMediaManagement';
import SEO from '../../components/SEO';

export const AddaMediaManagementPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="আড্ডা মিডিয়া ম্যানেজমেন্ট | সুপার এডমিন" 
        description="আড্ডা সোশ্যাল নেটওয়ার্কের ফটো, ভিডিও, রিলস ও স্টোরিজের ফাইল সাইজ, আপলোডার ও স্টোরেজ পাথ অডিট সেন্টার।" 
      />
      <AddaMediaManagement />
    </div>
  );
};

export default AddaMediaManagementPage;
