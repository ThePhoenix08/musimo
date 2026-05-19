import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

export default function InstrumentalAnalysis({
  tags,
}) {
  return (
    <Card className="border-white/10 bg-zinc-900/70">
      <CardHeader>
        <CardTitle>
          Instrumental Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="rounded-full bg-zinc-800 px-4 py-2"
          >
            {tag}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}