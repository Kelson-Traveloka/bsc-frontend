"use client";
import { Upload } from "lucide-react";

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

    const handleDivClick = () => {
        console.log("TESTING INPUT CLICK")
        const input = document.getElementById("file-upload") as HTMLInputElement;
        if (input && !isLoading) input.click();
    };

    return (
        <div className={`rounded-2xl shadow-md border border-gray-200 p-4 transition-all duration-300 ${isDragging && "scale-105"}`}>
            <div
                className={`border border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragging
                    ? "border-gray-600/70 bg-gradient-to-br from-white to-white via-gray-600/10"
                    : "border-gray-600/50 hover:border-gray-600/70 bg-gradient-to-br from-white via-white to-white hover:via-gray-600/10"
                    } ${isLoading ? "opacity-50" : ""}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={handleDivClick}
            >
                {isLoading ? (
                    <div className="animate-spin mx-auto w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full mb-4"></div>
                ) : (
                    <Upload className="mx-auto w-16 h-16 text-gray-900 mb-4" />
                )}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {isLoading ? "Processing file..." : "Drop your file here"}
                </h3>
                <p className="text-gray-600 mb-2">or click to browse your files</p>
                <p className="text-sm text-gray-500">
                    Supported formats: CSV, XLSX, XLS (Max 10MB)
                </p>
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={onFileInputChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                />
            </div>
        </div>
    );
}
