import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useTranslations } from "next-intl";

export default function AlertMetricCard({
  title,
  value,
  severity,
  icon,
  onDetail,
}: any) {
  const t = useTranslations("admin.dashboard");
  const severityClasses = {
    high: "border-red-500 text-red-700 bg-red-50",
    medium: "border-yellow-500 text-yellow-700 bg-yellow-50",
    low: "border-blue-500 text-blue-700 bg-blue-50",
  };

  return (
    <Card
      className={`border-2 shadow-lg hover:shadow-2xl transition-shadow ${
        severityClasses[severity as keyof typeof severityClasses]
      } flex flex-col items-center justify-between p-0 min-h-[150px] h-full`}
    >
      <CardContent className="p-6 flex flex-col items-center justify-between h-full w-full">
        <div className="flex flex-col items-center justify-center gap-2 w-full flex-1">
          <div className="p-3 rounded-lg bg-white bg-opacity-50 flex items-center justify-center mb-2">
            {icon}
          </div>
          <div className="text-4xl font-extrabold text-gray-900 mb-1">
            {value}
          </div>
          <div className="text-sm font-medium text-gray-700 mb-2 text-center">
            {title}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full bg-transparent border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={onDetail}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t("alerts.viewDetail")}
        </Button>
      </CardContent>
    </Card>
  );
}
