import { Badge } from "@/components/ui/badge";

export default function InstrumentalAnalysis({
  instruments = [],
}) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <h2 className="mb-6 text-xl font-semibold text-white">
        Instrumental Analysis
      </h2>

      {
        instruments.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
            No Instruments Detected
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">

            {
              instruments.map((item, index) => (

                <Badge
                  key={index}
                  className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 text-primary"
                >
                  {item.instrument} ({item.count})
                </Badge>

              ))
            }

          </div>
        )
      }

    </div>
  );
}