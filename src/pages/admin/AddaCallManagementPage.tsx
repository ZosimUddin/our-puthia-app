import React from 'react';
import AddaCallManagement from '../../components/admin/AddaCallManagement';
import SEO from '../../components/SEO';

export const AddaCallManagementPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="কল ম্যানেজমেন্ট ও সেফটি হাব | সুপার এডমিন" 
        description="আড্ডা সোশ্যাল অডিও ও ভিডিও কল রিপোর্ট, কল হ্যারাসমেন্ট তদন্ত, কল ব্লক ও কলার রেস্ট্রিকশন কমান্ড সেন্টার।" 
      />
      <AddaCallManagement />
    </div>
  );
};

export default AddaCallManagementPage;
