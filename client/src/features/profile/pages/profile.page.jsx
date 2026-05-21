import {
  Activity,
  BarChart3,
  Music2,
  Brain,
  Settings,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import ProfileToolbar from "../components/profile-toolbar";

import {
  useGetProfileQuery,
  useGetProfileAnalysisQuery,
} from "../state/api/profile.api";

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
import { SkeletonAvatar } from "@/shared/providers/skeleton.avatar";

function ProfilePage() {

  const {
    data: profile,
    isLoading: loading,
    error,
  } = useGetProfileQuery();

  const {
    data: analysis,
    isLoading: analysisLoading,
  } = useGetProfileAnalysisQuery();

  const {
    openModal,
    setManualOpen,
    isForcedReset,
    handleLogout,
  } = useProfilePage();

  if (loading || analysisLoading) {

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

  const stats = [
    {
      title: "Projects",
      value:
        analysis?.stats?.total_projects || 0,
      icon: BarChart3,
    },
    {
      title: "Songs",
      value:
        analysis?.stats?.total_songs || 0,
      icon: Music2,
    },
    {
      title: "AI Insights",
      value:
        analysis?.stats?.total_analyses || 0,
      icon: Brain,
    },
  ];

  const emotions =
    analysis?.emotion_score_breakdown
      ? Object.entries(
        analysis.emotion_score_breakdown
      ).map(([label, value]) => ({
        label,
        value: Math.round(value * 100),
      }))
      : [];

  const tags =
    analysis?.top_instruments?.length > 0
      ? analysis.top_instruments
      : ["No Instruments Detected"];

  const activities =
    analysis?.recent_projects?.map(
      (project) => ({
        project: project.name,
        action: "Created",
        time: new Date(
          project.created_at
        ).toLocaleDateString(),
      })
    ) || [];

  const insights = [
    `Dominant emotion: ${analysis?.music_profile
      ?.dominant_emotion || "Unknown"
    }`,
    `Favorite instrument: ${analysis?.music_profile
      ?.favorite_instrument || "N/A"
    }`,
    `Total storage used: ${(
      (analysis?.stats
        ?.total_storage_bytes || 0) /
      (1024 * 1024)
    ).toFixed(2)} MB`,
    `Average song duration: ${analysis?.stats
      ?.average_song_duration_seconds || 0
    } sec`,
  ];

  return (

    <div id="profile-page" className="min-h-screen w-full overflow-y-auto bg-black pb-20 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col space-y-8 px-4 py-6 md:px-8">

        <ProfileToolbar
          handleLogout={handleLogout}
        />

        {profile && (
          <ProfileHeader
            profile={profile}
          />
        )}

        <Tabs
          defaultValue="analysis"
          className="space-y-6"
        >

          <div className="sticky top-0 z-20 bg-black/80 py-2 backdrop-blur-xl">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-white/10 bg-zinc-900/80">

              <TabsTrigger
                value="analysis"
                className="data-[state=active]:bg-yellow-400 data-[state=active]:text-primary"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Profile Analysis
              </TabsTrigger>

              <TabsTrigger
                value="activities"
                className="data-[state=active]:bg-yellow-400 data-[state=active]:text-primary"
              >
                <Activity className="mr-2 h-4 w-4" />
                Recent Activities
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-yellow-400 data-[state=active]:text-primary"
              >
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

              <ProjectSummary
                stats={analysis?.stats}
              />
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
              setManualOpen={
                setManualOpen
              }
            />

            <PreferencesSettings />
            <SubscriptionCard />
            <DangerZone />
          </TabsContent>
        </Tabs>

        {openModal && (
          <ResetPasswordDialog
            open={openModal}
            forcedReset={
              isForcedReset
            }
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