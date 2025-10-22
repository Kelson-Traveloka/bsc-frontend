"use client";
import FollowTooltip from "./follow-tooltip";
import { useState } from "react";

interface ExcelTablePreviewProps {
    content: string[][];
    onCellClick?: (rowIndex: number, colLabel: string, cellValue: string) => void;
    activeLabel: string;
}

export default function ExcelTablePreview({ content, onCellClick, activeLabel }: ExcelTablePreviewProps) {
    const [isHovering, setIsHovering] = useState(false);

    const maxCols = Math.max(...content.map(row => row.length));
    const normalizedContent = content.map(row => {
        const newRow = [...row];
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
    });

    const getColumnLabel = (index: number): string => {
        let label = "";
        let n = index;
        while (n >= 0) {
            label = String.fromCharCode((n % 26) + 65) + label;
            n = Math.floor(n / 26) - 1;
        }
        return label;
    };

    return (
        <div onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative bg-white rounded-2xl shadow-md border border-gray-200 overflow-auto max-h-[600px]">
            <table className="w-full border-collapse table-auto">
                <thead className="sticky top-0 z-20">
                    <tr>
                        <th className="px-4 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-600/10 backdrop-blur-sm border-r border-b border-gray-200 sticky left-0 z-20"></th>
                        {Array.from({ length: maxCols }).map((_, index) => (
                            <th
                                key={index}
                                className="px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-600/10 backdrop-blur-sm border-r border-gray-200 text-center"
                            >
                                {getColumnLabel(index)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                    {normalizedContent.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <td className="px-2 py-2 font-bold text-sm text-gray-700 text-center bg-gray-600/10 backdrop-blur-sm border-r border-gray-200 w-12 sticky left-0 z-10">
                                {rowIndex + 1}
                            </td>
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    onClick={() =>
                                        onCellClick &&
                                        onCellClick(rowIndex + 1, getColumnLabel(cellIndex), cell)
                                    }
                                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200 hover:bg-gray-200/60 active:bg-gray-300 transition-colors cursor-pointer select-none"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <FollowTooltip text={activeLabel} visible={isHovering && !!activeLabel} />
        </div>
    );
}
