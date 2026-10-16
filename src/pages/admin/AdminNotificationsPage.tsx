import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { AdminNotificationHub } from '../../components/admin/AdminNotificationHub';
import SEO from '../../components/SEO';

export default function AdminNotificationsPage() {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="এডমিন নোটিফিকেশন হাব - পুঠিয়া ডিজিটাল সেবা" 
        description="প্রশাসনিক নোটিফিকেশন ব্রডকাস্ট, অডিট লগ ও ডেলিভারি মেট্রিক্স" 
      />

      <div className="w-full">
        {/* Central Admin Hub Component */}
        <AdminNotificationHub />
      </div>
    </div>
  );
}
