"use client"
import { BANKS } from '@/constants/bank';
import React, { useState } from 'react'

const BankTemplateList = ({
    handleBankSelect,
    selectedBank
}: {
    handleBankSelect: (bank: typeof BANKS[number]) => void;
    selectedBank: string | null;
}) => {
    return (
        <div className="bg-transparent rounded-2xl shadow-md border border-gray-200 p-6 overflow-x-auto">
            <div className="flex items-center justify-start gap-4 w-max">
                {BANKS.sort((a, b) => a.code.localeCompare(b.code)).map((bank) => {
                    const isSelected = selectedBank === bank.code;
                    return (
                        <div
                            key={bank.code}
                            onClick={() => handleBankSelect(bank)}
                            className={`cursor-pointer border rounded-md w-48 flex-shrink-0 p-3 px-5 flex flex-col justify-center items-start transition-all duration-200
                        ${isSelected
                                    ? "bg-gray-100 border-gray-400 shadow-md"
                                    : "hover:bg-zinc-200/50 hover:shadow-sm border-gray-300"
                                }`}
                        >
                            <span className="font-semibold">{bank.code}</span>
                            <span
                                className="text-gray-600 text-sm text-nowrap truncate w-full"
                                title={bank.name}
                            >
                                {bank.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default BankTemplateList
