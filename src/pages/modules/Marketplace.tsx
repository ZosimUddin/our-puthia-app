import React from 'react';
import SEO from '../../components/SEO';
import { ServiceDirectoryTemplate } from '../../components/common/MasterServiceTemplate/ServiceDirectoryTemplate';

export default function Marketplace() {
  return (
    <>
      <SEO
        title="অনলাইন হাট ও স্থানীয় কেনাবেচা বাজার"
        description="পুঠিয়া উপজেলার অনলাইন কেনাবেচা হাট। স্থানীয় কৃষিপণ্য, ইলেকট্রনিক্স, যানবাহন, বাড়ি ভাড়া ও উদ্যোক্তাদের কেনাবেচা বাজার।"
        path="/marketplace"
      />
      <ServiceDirectoryTemplate serviceKeyParam="marketplace" />
    </>
  );
}
