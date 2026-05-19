import AccountSettings from "../components/account-settings";
import DangerZone from "../components/danger-zone";
import PreferencesSettings from "../components/preferences-settings";
import SubscriptionCard from "../components/subscription-card";

function SettingsPage() {
  return (
    <div className="h-screen overflow-y-auto px-6 py-6">
      <h2 className="text-2xl font-bold">
         Settings
      </h2>
      <div className="mt-6 space-y-6">
        <PreferencesSettings />
        <SubscriptionCard />
        <DangerZone />
      </div>
    </div>
  );
}

export default SettingsPage;