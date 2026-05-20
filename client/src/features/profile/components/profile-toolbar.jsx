import {
  Search,
  Share2,
  Download,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

export default function ProfileToolbar({
  handleLogout,
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search projects, analytics, tracks..."
            className="h-11 rounded-2xl border-white/10 bg-zinc-900 pl-11 text-white placeholder:text-zinc-500 "
          />
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-3 md:w-auto md:justify-end">

        <Button className="gap-2 bg-yellow-600 hover:bg-yellow-500">
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="destructive"
          onClick={handleLogout}
          className="gap-2 bg-red-900"
        >
          <LogOut className="h-4 w-4"/>
        </Button>
      </div>
    </div>
  );
}