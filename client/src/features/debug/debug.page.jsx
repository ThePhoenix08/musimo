import { Outlet } from "react-router";

function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Debug Page</h1>
      <Outlet />
    </div>
  );
}
export default DebugPage;
