import React from 'react';
import AddaSystemSettings from '../../components/admin/AddaSystemSettings';
import SEO from '../../components/SEO';

export const AddaSystemSettingsPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="Adda System Settings | সুপার এডমিন কমান্ড সেন্টার" 
        description="আড্ডা সোশ্যাল প্ল্যাটফর্মের ১৩টি মডিউল সেটিং, ফাইল লিমিট, ভিডিও ডিউরেশন, প্রাইভেসি ও এআই মডারেশন এক সেন্ট্রাল হাব থেকে পরিচালনা করুন।" 
      />
      <AddaSystemSettings />
    </div>
  );
};

export default AddaSystemSettingsPage;
