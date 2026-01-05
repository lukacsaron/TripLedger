
import { Metadata } from "next";
import { MassImportWizard } from "@/components/expenses/mass-import-wizard";

export const metadata: Metadata = {
    title: "Mass Import Expenses | Zen Accounting",
    description: "Upload receipts and bank statements to automatically create expenses.",
};

export default function MassImportPage() {
    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Mass Import Expenses</h1>
                <p className="text-muted-foreground">
                    Upload multiple receipts and your bank statement to automatically match and create expenses.
                </p>
            </div>

            <MassImportWizard />
        </div>
    );
}
