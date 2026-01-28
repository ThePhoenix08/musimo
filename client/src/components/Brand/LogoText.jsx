import React from "react";

function LogoText() {
  return (
    <div className="relative z-10 flex items-center gap-2 focus:outline-none">
      <div className="w-10 shrink-0">
        <img src="" alt="logo" className="w-full" />
      </div>

      <div className="flex flex-col leading-tight gap">
        <span className="font-(family-name:--font-anta) text-xl font-bold tracking-wider text-primary">
          Musimo
        </span>
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          The Sound Intelligence
        </span>
      </div>
    </div>
  );
}

export default LogoText;
