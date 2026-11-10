import React from 'react';
import SEO from '../../components/SEO';
import { ServiceDirectoryTemplate } from '../../components/common/MasterServiceTemplate/ServiceDirectoryTemplate';

export default function Tourism({ onGoBack }: { onGoBack?: () => void } = {}) {
  return (
    <>
      <SEO
        title="পুঠিয়া পর্যটন ও দর্শনীয় স্থান"
        description="ঐতিহাসিক পুঠিয়া রাজবাড়ী, টেরাকোটা মন্দির কমপ্লেক্স, শিব মন্দির ও সকল দর্শনীয় স্থানের বিস্তারিত তথ্য ও ভ্রমণ গাইড।"
        path="/tourism"
      />
      <ServiceDirectoryTemplate serviceKeyParam="tourism" />
    </>
  );
}
