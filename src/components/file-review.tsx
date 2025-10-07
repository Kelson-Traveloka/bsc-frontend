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

    const fieldLabels = [
        "Account ID",
        "Opening balance date",
        "Opening balance direction",
        "Opening balance amount",
        "Closing balance date",
        "Closing balance direction",
        "Closing balance amount",
        "Account Currency",
        "Statement ID",
    ];

    const [fieldValues, setFieldValues] = useState<string[]>(
        Array(fieldLabels.length).fill("")
    );

    const [activeField, setActiveField] = useState<number | null>(0);

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

    const handleCellClick = (
        rowIndex: number,
        colLabel: string,
        cellValue: string
    ) => {
        if (activeField === null) return;
        const newValues = [...fieldValues];
        newValues[activeField] = cellValue;
        setFieldValues(newValues);

        if (activeField < fieldLabels.length - 1) {
            setActiveField(activeField + 1);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-transparent rounded-2xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 animate-pulse rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black">{file.name}</h3>
                            <p className="text-sm text-gray-600">
                                {formatFileSize(file.size)} •{" "}
                                {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-gray-500 hover:text-black hover:bg-gray-300/30 rounded-lg transition-colors"
                    >
                        Upload Different File
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldLabels.map((label, index) => (
                    <div key={index} className="flex flex-col">
                        <label className="gray-700 text-sm mb-1">{label}</label>
                        <input
                            type="text"
                            value={fieldValues[index]}
                            onChange={(e) => {
                                const newValues = [...fieldValues];
                                newValues[index] = e.target.value;
                                setFieldValues(newValues);
                            }}
                            onFocus={() => setActiveField(index)}
                            placeholder={`Click cell to fill ${label}`}
                            className={`px-4 py-2 rounded-sm border-b text-black focus:outline-none ${activeField === index ? "border-gray-600" : "border-gray-300"
                                }`}
                        />
                    </div>
                ))}
            </div>

            <ExcelTablePreview content={file.content} onCellClick={handleCellClick} activeLabel={activeField !== null ? fieldLabels[activeField] : ""}
            />

            {/* Conversion Section */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-black mb-2">
                        Ready to Convert
                    </h3>
                    <p className="gray-700 mb-6">
                        Your file has been successfully uploaded and is ready for conversion.
                    </p>
                    {loading ? (
                        <div className="animate-spin mx-auto size-10 border-4 border-gray-500 border-t-transparent rounded-full mb-4"></div>

                    ) : (
                        <button
                            onClick={handleConvert}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
