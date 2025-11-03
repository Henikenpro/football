// app/page.tsx
import React from 'react';
import footballFetch from '../lib/footballClient';
import { formatDateTime, translateStatus } from '../lib/i18n';
import LiveScoreClient from '@/components/LiveScoreClient';
import StatsSection from '@/components/StatsSection';
import Hero from '@/components/Hero';
import FeaturedMatches from '@/components/FeaturedMatches';
import FeaturesGrid from '@/components/FeaturesGrid';

export default async function HomePage() {
//refresh trang call api 2 lần
  return (
    <main>
    <Hero />
      <StatsSection />
      <FeaturedMatches />
      <FeaturesGrid />
    </main>
  );
}