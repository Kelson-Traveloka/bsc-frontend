"use client";
import * as XLSX from "xlsx";
import React, { useState, useCallback } from "react";
import UploadArea from "@/components/upload-area";
import FilePreview from "@/components/file-review";

interface FileData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: string[][];
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleFileRead = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      let content: string[][] = [];

      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        content = lines
          .map((line) => {
            const result: string[] = [];
            let current = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') inQuotes = !inQuotes;
              else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          })
          .filter((row) => row.some((cell) => cell.length > 0));
      } else {
        // XLS/XLSX files
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        content = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][];
      }

      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        content,
      });
      setIsLoading(false);
    };

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };


  const handleFileUpload = useCallback((file: File) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert("Please upload only CSV, XLSX, or XLS files.");
      return;
    }

    setIsLoading(true);
    handleFileRead(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFileUpload(files[0]);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleConvert = () => {
    alert("Convert button clicked! Add your conversion logic here.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8 flex justify-center items-center">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">File Converter</h1>
          <p className="text-lg text-gray-300">
            Upload your CSV, XLSX, or XLS files for processing
          </p>
        </div>

        {!uploadedFile ? (
          <UploadArea
            isDragging={isDragging}
            isLoading={isLoading}
            onFileInputChange={handleFileInputChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          />
        ) : (
          <FilePreview
            file={uploadedFile}
            onReset={() => setUploadedFile(null)}
            onConvert={handleConvert}
          />
        )}
      </div>
    </div>
  );
}
