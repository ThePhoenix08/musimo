import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './tabs/overview-tab';
import MfccTab from './tabs/mfcc-tab';
import SpectralTab from './tabs/spectral-tab';
import HarmonicsTab from './tabs/harmonics-tab';
import { BarChart3, Music, Waves, Zap } from 'lucide-react';

export default function DashboardFeatures({ data }) {

  const audioData = data;

  if (!audioData) {
    return (
      <div className="text-center py-8">
        No audio data available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">

        <Tabs defaultValue="overview" className="w-full">

          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card/50 border border-border rounded-xl p-1 sm:p-2 mb-6 sm:mb-8 gap-1 sm:gap-2">

            <TabsTrigger value="overview">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Overview</span>
            </TabsTrigger>

            <TabsTrigger value="mfcc">
              <Waves className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>MFCC</span>
            </TabsTrigger>

            <TabsTrigger value="spectral">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Spectral</span>
            </TabsTrigger>

            <TabsTrigger value="harmonics">
              <Music className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Harmonics</span>
            </TabsTrigger>

          </TabsList>

          <TabsContent value="overview">
            <OverviewTab data={audioData} />
          </TabsContent>

          <TabsContent value="mfcc">
            <MfccTab data={audioData} />
          </TabsContent>

          <TabsContent value="spectral">
            <SpectralTab data={audioData} />
          </TabsContent>

          <TabsContent value="harmonics">
            <HarmonicsTab data={audioData} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}