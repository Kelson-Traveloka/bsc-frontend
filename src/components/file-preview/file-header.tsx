import { FileData } from '@/types/file-data';
import { formatFileSize } from '@/utils/file-helper'; 
import React from 'react'

const FileHeader = ({
    file,
    onReset,
}: {
    file: FileData;
    onReset: () => void;
}) => {
    return (
        <div className="bg-transparent rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 animate-pulse rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-check-big-icon lucide-circle-check-big w-6 h-6 text-green-400"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg>
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
    )
}

export default FileHeader
