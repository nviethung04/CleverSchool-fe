import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import React from "react";

interface ExportDataProps {
  onExport: () => void;
  exporting?: boolean;
  label?: string;
}

export const ExportData: React.FC<ExportDataProps> = ({
  onExport,
  exporting,
  label,
}) => {
  return (
    <Button
      onClick={onExport}
      disabled={exporting}
      className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {exporting ? (
        <Loader2 className="animate-spin mr-2 h-4 w-4" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label || "Export"}
    </Button>
  );
};

export default ExportData;
