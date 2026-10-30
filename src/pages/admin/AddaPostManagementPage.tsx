import React from 'react';
import AddaPostManagement from '../../components/admin/AddaPostManagement';
import SEO from '../../components/SEO';

export const AddaPostManagementPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="আড্ডা পোস্ট ম্যানেজমেন্ট | সুপার এডমিন" 
        description="পুঠিয়া নাগরিক আড্ডার ছবি, ভিডিও, টেক্সট, রিলস ও সকল পোস্ট ব্যবস্থাপনা, হাইড, রিস্টোর ও ডিলিট কমান্ড সেন্টার।" 
      />
      <AddaPostManagement />
    </div>
  );
};

export default AddaPostManagementPage;
