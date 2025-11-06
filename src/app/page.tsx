"use client";
import React, { useState, useCallback } from "react";
import UploadArea from "@/components/upload-area";
import FilePreview from "@/components/file-review";
import { FileData } from "@/types/file-data";
import { readExcelFile } from "@/utils/read-excel";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileRead = async (file: File) => {
    setIsLoading(true);
    try {
      const content = await readExcelFile(file);
      setUploadedFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        content,
      });
    } catch (err) {
      console.error("❌ Error reading file:", err);
      alert("Failed to read this file. Please check your format or try again.");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 flex justify-center items-center">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-3">
            Convert Your Bank Statements Instantly
          </h1>
          <p className="text-lg text-gray-700">
            Upload your bank statement and get a ready-to-use Kyriba template in seconds.
            Fast, accurate, and hassle-free — built to simplify your treasury workflow.
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
          />
        )}
      </div>
    </div>
  );
}