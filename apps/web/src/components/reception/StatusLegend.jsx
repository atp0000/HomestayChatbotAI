import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLOR, STATUS_LABEL } from "./ReceptionConstants";

// CHÚ THÍCH TRẠNG THÁI
export default function StatusLegend() {
  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-wrap gap-6">
        {Object.entries(STATUS_LABEL).map(([k, l]) => (
          <span key={k} className="flex items-center gap-2 text-sm font-medium">
            <Badge className={STATUS_COLOR[k]}>&nbsp;</Badge>
            {l}
          </span>
        ))}
      </div>
    </Card>
  );
}