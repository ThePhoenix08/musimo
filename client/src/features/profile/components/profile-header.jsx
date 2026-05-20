import {
    ShieldCheck,
} from "lucide-react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import { useMemo } from "react";

export default function ProfileHeader({
    profile,
}) {

    const initials = useMemo(() => (
        profile?.name
            ?.split(" ")
            ?.filter(Boolean)
            ?.map((n) => n[0])
            ?.join("")
    ), [profile]);

    const avatarURL = useMemo(() => (
        `https://i.pravatar.cc/150?u=${profile?.name}`
    ), [profile]);

    return (
        <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 shadow-2xl backdrop-blur-xl">

            <CardContent className="p-6">

                <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-center md:text-left">

                    {/* AVATAR */}
                    <Avatar className="h-20 w-20 border-2 border-emerald-500/30">

                        <AvatarImage
                            src={avatarURL}
                            alt={profile?.name}
                        />

                        <AvatarFallback>
                            {initials}
                        </AvatarFallback>
                    </Avatar>


                    <div className="space-y-3">

                        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">

                            <h1 className="text-2xl font-bold">
                                @{profile?.username}
                            </h1>

                            <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">

                                <ShieldCheck className="mr-1 h-3 w-3" />
                                {profile?.email_verified
                                    ? "Verified"
                                    : "UnVerified"}
                            </Badge>
                        </div>


                        <div className="space-y-1 text-sm text-zinc-400">

                            <p className="font-medium text-zinc-200">
                                {profile?.name}
                            </p>

                            <p>
                                {profile?.email}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}