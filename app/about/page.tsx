import React from 'react';
import AboutPage from '../../src/components/AboutPage';

export const metadata = {
  title: 'About Us | AVER Technologies',
  description: 'AI-powered trading workspace and market execution platform connected to real-time NYSE telemetry streams.',
  alternates: {
    canonical: 'https://avertrader.space/about',
  },
};

export default function Page() {
  return <AboutPage />;
}
