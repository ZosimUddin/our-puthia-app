import React from 'react';
import AddaUserManagement from '../../components/admin/AddaUserManagement';
import SEO from '../../components/SEO';

export const AddaUserManagementPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="আড্ডা ইউজার ম্যানেজমেন্ট | সুপার এডমিন" 
        description="আড্ডা সোশ্যাল নেটওয়ার্ক ও পোর্টালের সকল ইউজারদের সার্বিক নিয়ন্ত্রণ, ভেরিফিকেশন ও সিকিউরিটি হাব।" 
      />
      <AddaUserManagement />
    </div>
  );
};

export default AddaUserManagementPage;
