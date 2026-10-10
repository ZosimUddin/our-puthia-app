import React from 'react';
import AddaMessengerControl from '../../components/admin/AddaMessengerControl';
import SEO from '../../components/SEO';

export const AddaMessengerControlPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="মেসেঞ্জার কন্ট্রোল ও সেফটি হাব | সুপার এডমিন" 
        description="আড্ডা সোশ্যাল মেসেঞ্জারের রিপোর্টকৃত মেসেজ, স্প্যাম, হ্যারাসমেন্ট তদন্ত এবং ইউজার মেসেজিং রেস্ট্রিকশন সেন্টার।" 
      />
      <AddaMessengerControl />
    </div>
  );
};

export default AddaMessengerControlPage;
