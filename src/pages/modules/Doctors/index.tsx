import React from 'react';
import SEO from '../../../components/SEO';
import { ServiceDirectoryTemplate } from '../../../components/common/MasterServiceTemplate/ServiceDirectoryTemplate';

export default function DoctorsPage({ onGoBack }: { onGoBack?: () => void } = {}) {
  return (
    <>
      <SEO
        title="ডাক্তার ও বিশেষজ্ঞ চিকিৎসক নির্দেশিকা"
        description="পুঠিয়া উপজেলার বিশেষজ্ঞ ডাক্তারদের তালিকা, হাসপাতাল ও চেম্বারের ঠিকানা, দেখার সময়সূচী এবং যোগাযোগের ফোন নম্বর।"
        path="/doctors"
      />
      <ServiceDirectoryTemplate serviceKeyParam="doctor" />
    </>
  );
}
