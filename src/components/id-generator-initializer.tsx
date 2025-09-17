"use client";

import { useEffect } from 'react';
import IDGenerator from '@/lib/id-generator';

export function IDGeneratorInitializer() {
  useEffect(() => {
    // Initialize ID counters when the app starts
    IDGenerator.initializeCounters();
  }, []);

  // This component doesn't render anything
  return null;
}
