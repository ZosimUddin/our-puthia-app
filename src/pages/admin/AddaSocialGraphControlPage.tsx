import React from 'react';
import AddaSocialGraphControl from '../../components/admin/AddaSocialGraphControl';
import SEO from '../../components/SEO';

export const AddaSocialGraphControlPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="ফ্রেন্ডস ও ফলো কন্ট্রোল হাব | সুপার এডমিন" 
        description="আড্ডা সোশ্যাল নেটওয়ার্কের ফ্রেন্ড রিকোয়েস্ট, ফলোয়ার, ফেক অ্যাক্টিভিটি শনাক্তকরণ, ম্যাস ফলো স্প্যাম ও ব্লকড ইউজার ব্যবস্থাপনা।" 
      />
      <AddaSocialGraphControl />
    </div>
  );
};

export default AddaSocialGraphControlPage;
