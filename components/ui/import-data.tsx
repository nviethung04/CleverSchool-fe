import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText } from "lucide-react";
import React, { useRef, useState } from "react";

interface ImportDataProps {
  onImport: (file: File) => void;
  importing?: boolean;
  accept?: string;
  label?: string;
}

export const ImportData: React.FC<ImportDataProps> = ({
  onImport,
  importing,
  accept,
  label,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <Upload className="mr-2 h-4 w-4" />
        {label || "Nhập dữ liệu"}
      </Button>
      {selectedFile && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 truncate max-w-32">
              {selectedFile.name}
            </span>
          </div>
          <Button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {importing ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : null}
            Xác nhận
          </Button>
        </>
      )}
    </div>
  );
};

export default ImportData;
