import { MappingGroupHT } from "@/types/mapping-information";

export const BANKS: {
    code: string;
    name: string;
    value: Record<string, string>;
}[] = [
    // BAY (Account ID, Account Currency, Statement ID)
    {
        code: "BAY",
        name: "Bank of Ayudhya",
        value: {
            "Account ID *": "",
            "Date [Header] *": "[A1]",
            "Opening balance amount *": "calc([G2]+[E2]-[F2])",
            "Account Currency *": "",
            "Statement ID *": "",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[E1]",
            "Credit Amount *": "[F1]",
            "Description": "",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // BBL (Complete)
    {
        code: "BBL",
        name: "Bangkok Bank",
        value: {
            "Account ID *": "[G3]",
            "Date [Header] *": "[A5]",
            "Opening balance amount *": "calc([Q7]+[L7]-[N7])",
            "Account Currency *": "THB",
            "Statement ID *": "[G3]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[L5]",
            "Credit Amount *": "[N5]",
            "Description": "[E5]",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // CTI (Opening Balance)
    {
        code: "CTI",
        name: "Citibank",
        value: {
            "Account ID *": "[A2]",
            "Date [Header] *": "[D1]",
            "Opening balance amount *": "",
            "Account Currency *": "[E2]",
            "Statement ID *": "[A2]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[F1]",
            "Credit Amount *": "[F1]",
            "Description": "[L1]",
            "Reference": "[I1]",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // KBANK (Account ID, Statemnt ID)
    {
        code: "KBANK",
        name: "Kasikornbank",
        value: {
            "Account ID *": "",
            "Date [Header] *": "[A1]",
            "Opening balance amount *": "calc([G2]+[E2]-[F2])",
            "Account Currency *": "[I2]",
            "Statement ID *": "",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[E1]",
            "Credit Amount *": "[F1]",
            "Description": "[C1]",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // KTB (Opening Balance: 3 Options (Ledger Balance, Available Balance, (First Day Balance - First Day Amount)))
    {
        code: "KTB",
        name: "Krung Thai Bank",
        value: {
            "Account ID *": "[B1]",
            "Date [Header] *": "[A6]",
            "Opening balance amount *": "",
            "Account Currency *": "[D1]",
            "Statement ID *": "[B1]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[F6]",
            "Credit Amount *": "[F6]",
            "Description": "[D6]",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // SCB (Complete)
    {
        code: "SCB",
        name: "Siam Commercial Bank",
        value: {
            "Account ID *": "[A2]",
            "Date [Header] *": "[B1]",
            "Opening balance amount *": "calc([J2]+[G2]-[H2])",
            "Account Currency *": "THB",
            "Statement ID *": "[A2]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[G1]",
            "Credit Amount *": "[H1]",
            "Description": "[K1]",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // SIC (Complete)
    {
        code: "SIC",
        name: "Siam Commercial Bank (SCB)",
        value: {
            "Account ID *": "[A2]",
            "Date [Header] *": "[B1]",
            "Opening balance amount *": "calc([J2]+[G2]-[H2])", 
            "Account Currency *": "THB",
            "Statement ID *": "[A2]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[G1]",
            "Credit Amount *": "[H1]",
            "Description": "[K1]",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // VCB (Complete)
    {
        code: "VCB",
        name: "Vietcombank",
        value: {
            "Account ID *": "[B4]",
            "Date [Header] *": "[A11]",
            "Opening balance amount *": "[D10]",
            "Account Currency *": "[B7]",
            "Statement ID *": "[B4]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[C11]",
            "Credit Amount *": "[D11]",
            "Description": "[E11]",
            "Reference": "[B11]",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
    // VTB (Complete)
    {
        code: "VTB",
        name: "VietinBank",
        value: {
            "Account ID *": "[C12]",
            "Date [Header] *": "[B25]",
            "Opening balance amount *": "[C17]",
            "Account Currency *": "[C14]",
            "Statement ID *": "[C12]",
            "Internal Bank Transaction Code": "",
            "Debit Amount *": "[D25]",
            "Credit Amount *": "[E25]",
            "Description": "concat([C25],[K25])",
            "Reference": "",
            "Transaction Original Amount": "",
            "Transaction Original Amount Currency": "",
        },
    },
] as const;
