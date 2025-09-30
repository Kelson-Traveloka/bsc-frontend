"use client";
import { CheckCircle, Download } from "lucide-react";
import ExcelTablePreview from "./excel-review";
import { formatFileSize } from "@/utils/file-helper";
import { FileData } from "@/types/file-data";
import { convertFile } from "@/services/convert-service";
import { downloadBlob } from "@/utils/download-blob";
import { useState } from "react";

export default function FilePreview({
    file,
    onReset,
}: {
    file: FileData;
    onReset: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleConvert = async () => {
        if (!file.file) return alert("No file available for conversion");
        setLoading(true);

        try {
            const blob = await convertFile(file.file);
            downloadBlob(blob, "converted_output.txt");
        } catch (err) {
            console.error(err);
            alert("Failed to convert file");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* File Information */}
            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                            <p className="text-sm text-gray-400">
                                {formatFileSize(file.size)} •{" "}
                                {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Upload Different File
                    </button>
                </div>
            </div>

            {/* Excel Table Preview */}
            <ExcelTablePreview content={file.content} />

            {/* Conversion Section */}
            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Ready to Convert
                    </h3>
                    <p className="text-gray-300 mb-6">
                        Your file has been successfully uploaded and is ready for conversion.
                    </p>
                    {loading ? (
                        <div className="animate-spin mx-auto size-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>

                    ) : (
                        <button
                            onClick={handleConvert}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Convert File
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
