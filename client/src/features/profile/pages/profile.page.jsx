// src/features/profile/pages/profile.page.jsx

import {
  Activity,
  BarChart3,
  Settings,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import ProfileToolbar from "../components/profile-toolbar";
import { useGetProfileQuery } from "../state/api/profile.api";
import ProfileHeader from "../components/profile-header";
import ProfileStats from "../components/profile-stats";
import EmotionBreakdown from "../components/emotion-breakdown";
import AIInsights from "../components/ai-insights";
import InstrumentalAnalysis from "../components/instrumental-analysis";
import ProjectSummary from "../components/project-summary";
import RecentActivities from "../components/recent-activities";
import AccountSettings from "../components/account-settings";
import PreferencesSettings from "../components/preferences-settings";
import SubscriptionCard from "../components/subscription-card";
import DangerZone from "../components/danger-zone";
import { ResetPasswordDialog } from "@/features/auth/components/ResetPassword";
import useProfilePage from "../hooks/useProfilePage";

import {
  stats,
  emotions,
  activities,
  insights,
  tags,
} from "../constants/profile.data";
import { SkeletonAvatar } from "@/shared/providers/skeleton.avatar";

function ProfilePage() {

  const { data: profile, isLoading: loading, error, } = useGetProfileQuery();

  const { openModal, setManualOpen, isForcedReset, handleLogout, } = useProfilePage();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <SkeletonAvatar />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-red-400">
        Failed to load profile
        {error.toString()}
      </div>
    );
  }

  return (

    <div className="min-h-screen w-full overflow-y-auto bg-black pb-20 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col space-y-8 px-4 py-6 md:px-8">
        <ProfileToolbar handleLogout={handleLogout} />

        {profile && (
          <ProfileHeader profile={profile} />
        )}
        <Tabs
          defaultValue="analysis"
          className="space-y-6"
        >
          <div className="sticky top-0 z-20 bg-black/80 py-2 backdrop-blur-xl">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-white/10 bg-zinc-900/80">
              <TabsTrigger value="analysis"className="data-[state=active]:bg-yellow-400 data-[state=active]:text-primary">
                <BarChart3 className="mr-2 h-4 w-4" />
                Profile Analysis
              </TabsTrigger>

              <TabsTrigger value="activities" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-primary">
                <Activity className="mr-2 h-4 w-4" />
                Recent Activities
              </TabsTrigger>

              <TabsTrigger value="settings" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-primary">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="analysis"
            className="space-y-6"
          >

            <ProfileStats stats={stats} />
            <div className="grid gap-6 lg:grid-cols-2">
              <EmotionBreakdown
                emotions={emotions}
              />
              <AIInsights
                insights={insights}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              <InstrumentalAnalysis
                tags={tags}
              />

              <ProjectSummary />
            </div>
          </TabsContent>
          <TabsContent value="activities">

            <RecentActivities
              activities={activities}
            />
          </TabsContent>

          <TabsContent
            value="settings"
            className="space-y-6"
          >

            <AccountSettings
              setManualOpen={setManualOpen}
            />

            <PreferencesSettings />

            <SubscriptionCard />

            <DangerZone />
          </TabsContent>
        </Tabs>

        {openModal && (
          <ResetPasswordDialog
            open={openModal}
            forcedReset={isForcedReset}
            onClose={() => {
              if (!isForcedReset) {
                setManualOpen(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;