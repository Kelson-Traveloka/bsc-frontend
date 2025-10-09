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
        "Date [Header]",
        "Opening balance amount",
        "Account Currency",
        "Statement ID",
    ];
    const [fieldInfo, setFieldInfo] = useState<
        { value: string; col: string | null; row: number | null }[]
    >(Array(fieldLabels.length).fill({ value: "", col: "", row: "" }));

    const previewHeader =
        "1;" +
        fieldInfo[0].value + ";" + // Account Id
        "[" + fieldInfo[1]?.col + (fieldInfo[1].col !== "" ? Number(fieldInfo[1]?.row) + 1 : "") + "];" + // Date [Header]
        ((fieldInfo[2].value !== null && fieldInfo[2].value !== "") ? (Number(fieldInfo[2].value) < 0 ? "D" : "C") : "") + ";" + // Opening Balance Direction
        fieldInfo[2].value + ";" + // Opening Balance Amount 
        "[" + fieldInfo[1]?.col + (fieldInfo[1].col !== "" ? Number(fieldInfo[1]?.row) + 1 : "") + "];" + // Date [Header]
        "[Closing Direction];" +
        "[Closing Amount];" +
        fieldInfo[3].value + ";" + // Account Currency 
        fieldInfo[4].value + ";"; // Statement ID

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

    const handleCellClick = (rowIndex: number, colLabel: string, cellValue: string) => {
        if (activeField === null) return;

        const newInfo = [...fieldInfo];
        newInfo[activeField] = { value: cellValue, row: rowIndex, col: colLabel };
        setFieldInfo(newInfo);

        if (activeField < fieldLabels.length) {
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
                <div className="col-span-2 flex justify-end items-center w-full">
                    <h3 className="font-semibold text-2xl text-gray-400">Header</h3>
                </div>
                {fieldLabels.map((label, index) => (
                    <div key={index} className="flex flex-col">
                        <label className="gray-700 text-sm mb-1">{label}</label>
                        <div className="relative flex justify-center items-center">
                            <input
                                type="text"
                                value={fieldInfo[index].value}
                                onChange={(e) => {
                                    const newInfo = [...fieldInfo];
                                    newInfo[index] = {
                                        ...newInfo[index],
                                        value: e.target.value,
                                    };
                                    setFieldInfo(newInfo);
                                }}
                                onFocus={() => setActiveField(index)}
                                placeholder={`Click cell to fill ${label}`}
                                className={`w-full px-4 py-2 rounded-sm border-b text-black focus:outline-none ${activeField === index ? "border-gray-600" : "border-gray-300"
                                    }`}
                            />
                            <label className="absolute right-3 text-gray-500">
                                {((index == 2) && fieldInfo[index].value != null && fieldInfo[index].value != "" ? (Number(fieldInfo[index].value) < 0 ? "(D)" : "(C)") : "")}
                            </label>
                        </div>
                    </div>
                ))}
                <div className="flex flex-col col-span-2 relative mt-5">
                    <label className="gray-700 text-sm mb-1 absolute right-3 -top-3 bg-white text-gray-600 px-2">Preview Output Header</label>
                    <input
                        type="text"
                        value={previewHeader}
                        readOnly
                        disabled
                        className="px-4 py-2 rounded-sm border text-gray-600 focus:outline-none border-gray-600/50"
                    />
                </div>
                <div className="col-span-2 flex justify-end items-center w-full mt-3">
                    <h3 className="font-semibold text-2xl text-gray-400">Transactions</h3>
                </div>
                {fieldLabels.map((label, index) => (
                    <div key={index} className="flex flex-col">
                        <label className="gray-700 text-sm mb-1">{label}</label>
                        <div className="relative flex justify-center items-center">
                            <input
                                type="text"
                                value={fieldInfo[index].value}
                                onChange={(e) => {
                                    const newInfo = [...fieldInfo];
                                    newInfo[index] = {
                                        ...newInfo[index],
                                        value: e.target.value,
                                    };
                                    setFieldInfo(newInfo);
                                }}
                                onFocus={() => setActiveField(index)}
                                placeholder={`Click cell to fill ${label}`}
                                className={`w-full px-4 py-2 rounded-sm border-b text-black focus:outline-none ${activeField === index ? "border-gray-600" : "border-gray-300"
                                    }`}
                            />
                            <label className="absolute right-3 text-gray-500">
                                {((index == 2) && fieldInfo[index].value != null && fieldInfo[index].value != "" ? (Number(fieldInfo[index].value) < 0 ? "(D)" : "(C)") : "")}
                            </label>
                        </div>
                    </div>
                ))}
                <div className="flex flex-col col-span-2 relative mt-5">
                    <label className="gray-700 text-sm mb-1 absolute right-3 -top-3 bg-white text-gray-600 px-2">Preview Output Transactions</label>
                    <input
                        type="text"
                        value={previewHeader}
                        readOnly
                        disabled
                        className="px-4 py-2 rounded-sm border text-gray-600 focus:outline-none border-gray-600/50"
                    />
                </div>
            </div>

            <ExcelTablePreview content={file.content} onCellClick={handleCellClick} activeLabel={activeField !== null ? fieldLabels[activeField] : ""}
            />

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
