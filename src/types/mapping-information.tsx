export interface MappingHeader {
    "Account ID *": string;
    "Date [Header] *": string;
    "Opening balance amount *": string;
    "Account Currency *": string;
    "Statement ID *": string;
}

export interface MappingTransaction {
    "Internal Bank Transaction Code"?: string | null;
    "Debit Amount *": number;
    "Credit Amount *": number;
    "Description"?: string | null;
    "Reference"?: string | null;
    "Transaction Original Amount"?: string | null;
    "Transaction Original Amount Currency"?: string | null;
}

export type MappingGroupHT = MappingHeader & MappingTransaction;
