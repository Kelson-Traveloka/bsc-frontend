"use client";
import { Upload, FileSpreadsheet } from "lucide-react";

export default function UploadArea({
    isDragging,
    isLoading,
    onFileInputChange,
    onDrop,
    onDragOver,
    onDragLeave,
}: {
    isDragging: boolean;
    isLoading: boolean;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
}) {
    return (
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
            <div
                className={`border border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragging
                    ? "border-blue-400 bg-gray-700 scale-105"
                    : "border-gray-600 hover:border-blue-400/50 hover:bg-gray-700"
                    } ${isLoading ? "opacity-50" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
            >
                {isLoading ? (
                    <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                ) : (
                    <Upload className="mx-auto w-16 h-16 text-gray-500 mb-4" />
                )}
                <h3 className="text-xl font-semibold text-gray-200 mb-2">
                    {isLoading ? "Processing file..." : "Drop your file here"}
                </h3>
                <p className="text-gray-400 mb-6">or click to browse your files</p>
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={onFileInputChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                />
                <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-7 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                    Choose File
                </label>
                <p className="text-sm text-gray-500 mt-4">
                    Supported formats: CSV, XLSX, XLS (Max 10MB)
                </p>
            </div>
        </div>
    );
}
