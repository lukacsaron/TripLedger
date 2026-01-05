
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Upload,
    FileText,
    Check,
    AlertCircle,
    Loader2,
    ArrowRight,
    Receipt,
    CreditCard,
    Merge,
    Split,
    Trash2
} from "lucide-react";
import { useGlobalCategories } from "@/lib/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTrips, type TripWithStats } from "@/lib/hooks/use-trips";

// Types
type ProcessingStatus = "idle" | "uploading" | "processing" | "complete" | "error";

interface ScannedExpr {
    merchant: string;
    date: string;
    amount: number;
    currency: "EUR" | "USD" | "HUF" | "HRK";
    category: string;
    description: string;
    paymentType: string;
    rawItems?: string[];
    [key: string]: any;
}

interface BankTransaction {
    merchant?: string | null;
    date: string; // YYYY-MM-DD
    amount: number;
    currency: "EUR" | "USD" | "HUF" | "HRK";
    description?: string | null;
    category?: string | null;
    subcategory?: string | null;
    originalCategory?: string | null;
}

interface MergedItem {
    id: string; // unique temp id
    source: "receipt" | "bank" | "merged";

    // Core data (prioritize receipt if merged)
    merchant: string;
    date: string;
    amount: number;
    currency: "EUR" | "USD" | "HUF" | "HRK";

    categoryName: string; // To be resolved to ID
    categoryId?: string;
    subcategoryName?: string;
    subcategoryId?: string;

    description?: string;
    paymentType: string;

    receiptData?: ScannedExpr;
    bankData?: BankTransaction;

    status: "valid" | "warning" | "error"; // validation status
}

export function MassImportWizard() {
    const router = useRouter();
    const [step, setStep] = useState<"upload" | "processing" | "review">("upload");

    // Files
    const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
    const [statementFile, setStatementFile] = useState<File | null>(null);

    // Processing State
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    // Data
    const [mergedItems, setMergedItems] = useState<MergedItem[]>([]);
    const [tripId, setTripId] = useState<string>("");

    // --- Global Categories ---
    const { data: globalCategories } = useGlobalCategories();

    // --- Trip Selection ---
    const { data: trips, isLoading: tripsLoading } = useTrips(); // Use existing hook

    // Set default trip if available and none selected
    useMemo(() => {
        if (!tripId && trips && trips.length > 0) {
            // Optional: Auto-select most recent trip? For now, let user select.
            // setTripId(trips[0].id);
        }
    }, [tripId, trips]);

    // --- Handlers ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "receipts" | "statement") => {
        if (e.target.files) {
            if (type === "receipts") {
                setReceiptFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            } else {
                setStatementFile(e.target.files[0]);
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: "receipts" | "statement") => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (type === "receipts") {
                // Filter for images
                const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                if (imageFiles.length > 0) {
                    setReceiptFiles(prev => [...prev, ...imageFiles]);
                    toast.success(`Added ${imageFiles.length} images`);
                } else {
                    toast.error("Only image files are allowed for receipts");
                }
            } else {
                const file = e.dataTransfer.files[0];
                if (file.type === "application/pdf" || file.type === "text/csv" || file.type === "text/plain" || file.name.endsWith('.csv')) {
                    setStatementFile(file);
                    toast.success("Statement file added");
                } else {
                    toast.error("Only PDF or CSV files are allowed for statements");
                }
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const removeFile = (index: number, type: "receipts") => {
        setReceiptFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeMergedItem = (id: string) => {
        setMergedItems(prev => prev.filter(item => item.id !== id));
    };

    const updateMergedItem = (id: string, updates: Partial<MergedItem>) => {
        setMergedItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            return { ...item, ...updates };
        }));
    };

    const startProcessing = async () => {
        if (!tripId) {
            toast.error("Please select a trip first.");
            return; // In reality, fetch trips and force selection
        }

        setStep("processing");
        setProcessingStatus("processing");
        setProgress(0);
        setStatusMessage("Initializing AI scanners...");

        const totalOps = receiptFiles.length + (statementFile ? 1 : 0);
        let completedOps = 0;

        const updateProgress = () => {
            completedOps++;
            setProgress(Math.round((completedOps / totalOps) * 100));
        };

        try {
            const scannedReceipts: ScannedExpr[] = [];
            let bankTransactions: BankTransaction[] = [];

            // 1. Scan Receipts (Parallel)
            if (receiptFiles.length > 0) {
                setStatusMessage(`Scanning ${receiptFiles.length} receipts...`);

                const receiptPromises = receiptFiles.map(async (file) => {
                    const reader = new FileReader();
                    return new Promise<ScannedExpr | null>((resolve) => {
                        reader.onload = async () => {
                            try {
                                const base64 = (reader.result as string);
                                const res = await fetch("/api/scan-receipt", {
                                    method: "POST",
                                    body: JSON.stringify({ image: base64, tripId }), // sending base64 url
                                });
                                if (!res.ok) throw new Error("Failed");
                                const data = await res.json();
                                updateProgress();
                                resolve(data);
                            } catch (e) {
                                console.error("Receipt scan failed", e);
                                updateProgress();
                                resolve(null); // Continue even if one fails
                            }
                        };
                        reader.readAsDataURL(file);
                    });
                });

                const results = await Promise.all(receiptPromises);
                scannedReceipts.push(...results.filter((r): r is ScannedExpr => r !== null));
            }

            // 2. Scan Statement
            if (statementFile) {
                setStatusMessage("Analyzing bank statement...");
                const formData = new FormData();
                formData.append("file", statementFile);

                try {
                    const res = await fetch("/api/scan-statement", {
                        method: "POST",
                        body: formData,
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.transactions) {
                            bankTransactions = data.transactions;
                        }
                    }
                } catch (e) {
                    console.error("Statement scan failed", e);
                    toast.error("Failed to parse bank statement");
                }
                updateProgress();
            }

            // 3. Match Logic
            setStatusMessage("Matching transactions...");

            const newMergedItems: MergedItem[] = [];
            const usedReceiptIndices = new Set<number>();

            // Iterate bank transactions to find receipt matches
            bankTransactions.forEach((bt) => {
                // Simple matcher: Same Date AND Same Amount (within small epsilon of 0.01? No, exact usually, or small diff for currency conversion error?)
                // Assuming same currency for matching simplicity

                const matchIndex = scannedReceipts.findIndex((r, idx) =>
                    !usedReceiptIndices.has(idx) &&
                    r.date === bt.date &&
                    r.currency === bt.currency &&
                    Math.abs(r.amount - bt.amount) < 0.1
                );

                if (matchIndex !== -1) {
                    // Match found!
                    usedReceiptIndices.add(matchIndex);
                    const receipt = scannedReceipts[matchIndex];

                    newMergedItems.push({
                        id: crypto.randomUUID(),
                        source: "merged",
                        merchant: receipt.merchant, // Prefer receipt merchant name usually
                        date: receipt.date,
                        amount: receipt.amount,
                        currency: receipt.currency,
                        categoryName: receipt.category,
                        categoryId: undefined, // Will be resolved if name matches
                        description: receipt.description,
                        paymentType: receipt.paymentType,
                        receiptData: receipt,
                        bankData: bt,
                        status: "valid"
                    });
                } else {
                    // No match, add as Bank-only item
                    newMergedItems.push({
                        id: crypto.randomUUID(),
                        source: "bank",
                        merchant: bt.merchant || "Unknown",
                        date: bt.date,
                        amount: bt.amount,
                        currency: bt.currency,
                        categoryName: bt.category || "Other", // Use AI category if available
                        categoryId: undefined,
                        subcategoryName: bt.subcategory || undefined,
                        subcategoryId: undefined,
                        description: bt.description || undefined,
                        paymentType: "CARD", // Bank statement implies card/wire usually
                        bankData: bt,
                        status: "warning" // Needs review maybe?
                    });
                }
            });

            // Add remaining unmatched receipts
            scannedReceipts.forEach((r, idx) => {
                if (!usedReceiptIndices.has(idx)) {
                    newMergedItems.push({
                        id: crypto.randomUUID(),
                        source: "receipt",
                        merchant: r.merchant,
                        date: r.date,
                        amount: r.amount,
                        currency: r.currency,
                        categoryName: r.category,
                        categoryId: undefined,
                        description: r.description,
                        paymentType: r.paymentType,
                        receiptData: r,
                        status: "valid"
                    });
                }
            });

            // Resolving Categories
            if (globalCategories) {
                newMergedItems.forEach(item => {
                    // Try exact match
                    const cat = globalCategories.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
                    if (cat) {
                        item.categoryId = cat.id;
                        item.categoryName = cat.name; // Normalize

                        // Try to resolve subcategory if name is present
                        if (item.subcategoryName) {
                            const sub = cat.subcategories?.find(s => s.name.toLowerCase() === item.subcategoryName?.toLowerCase());
                            if (sub) {
                                item.subcategoryId = sub.id;
                                item.subcategoryName = sub.name; // Normalize
                            }
                        }
                    } else {
                        // Default to first or "Other"
                        const defaultCat = globalCategories.find(c => c.name === "Other") || globalCategories[0];
                        if (defaultCat) {
                            item.categoryId = defaultCat.id;
                            item.categoryName = defaultCat.name;
                        }
                    }
                });
            }

            // Sort by date
            newMergedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setMergedItems(newMergedItems);
            setStep("review");

        } catch (error) {
            console.error("Processing error", error);
            toast.error("An error occurred during processing.");
            setStep("upload"); // Go back
        }
    };

    const handleSave = async () => {
        // Submit to batch API
        try {
            const payload = {
                expenses: mergedItems.map(item => ({
                    tripId,
                    date: new Date(item.date).toISOString(),
                    merchant: item.merchant,
                    amountOriginal: item.amount,
                    currency: item.currency,
                    categoryName: item.categoryName,
                    categoryId: item.categoryId,
                    subcategoryName: item.subcategoryName, // Should be mostly null if using ID
                    subcategoryId: item.subcategoryId,
                    paymentType: item.paymentType,
                    description: item.description,
                    isAiParsed: true,
                    rawItemsText: item.receiptData?.rawItems?.join("\n")
                }))
            };

            const res = await fetch("/api/expenses/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            const result = await res.json();
            toast.success(`Successfully saved ${result.count} expenses!`);
            router.push("/dashboard"); // or expenses list

        } catch (e) {
            toast.error("Failed to save expenses.");
        }
    };

    // --- Trip Fetching Effect ---
    // Using a simple fetch for now.
    useState(() => {
        // Needs an API to list trips. 
        // Assuming /api/trips exists or we skip for now and ask user to input ID if needed?
        // Let's rely on the user having at least one trip and fetch them.
        // Actually, previous context showed /api/trips/[id] exists. Not sure about list.
        // I will add a text input for Trip ID for now to be safe, or just hardcode if testing?
        // Better: Fetch from /api/trips (if I create it? No, I shouldn't creates extra APIs if not in plan).
        // I'll check if there is a way to get trips.
        // Wait, the user has `app/settings/page.tsx` which likely lists trips?
        // I'll stick to a Manual Input for Trip ID or "Select Trip" placeholder for this artifact. 
        // I will implement a fetch in `useEffect` just in case /api/trips is standard or simple to add.
        // For this code, I'll assume I can just fetch `/api/trips` if it existed, otherwise fail gracefully.
    });

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Mass Import Wizard</CardTitle>
                <CardDescription>
                    {step === "upload" && "Upload your files to get started."}
                    {step === "processing" && "Analyzing your documents with AI..."}
                    {step === "review" && "Review and merge your transactions before saving."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === "upload" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Receipts Upload */}
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, "receipts")}
                                onClick={() => document.getElementById("receipt-upload")?.click()}
                            >
                                <Receipt className="h-10 w-10 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="font-medium">Upload Receipts</p>
                                    <p className="text-sm text-muted-foreground">Drop images here or click to browse</p>
                                </div>
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    id="receipt-upload"
                                    onChange={(e) => handleFileChange(e, "receipts")}
                                />
                                <Button variant="outline" onClick={() => document.getElementById("receipt-upload")?.click()}>
                                    Select Files
                                </Button>
                                {receiptFiles.length > 0 && (
                                    <div className="w-full mt-4 space-y-2">
                                        <p className="text-sm font-medium">{receiptFiles.length} files selected</p>
                                        <ScrollArea className="h-24 w-full border rounded-md p-2">
                                            {receiptFiles.map((f, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs py-1">
                                                    <span className="truncate max-w-[180px]">{f.name}</span>
                                                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeFile(i, "receipts")}>×</Button>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>

                            {/* Statement Upload */}
                            <div
                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, "statement")}
                                onClick={() => document.getElementById("statement-upload")?.click()}
                            >
                                <FileText className="h-10 w-10 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="font-medium">Bank Statement</p>
                                    <p className="text-sm text-muted-foreground">PDF or CSV</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".pdf,.csv,.txt"
                                    className="hidden"
                                    id="statement-upload"
                                    onChange={(e) => handleFileChange(e, "statement")}
                                />
                                <Button variant="outline" onClick={() => document.getElementById("statement-upload")?.click()}>
                                    {statementFile ? "Change File" : "Select File"}
                                </Button>
                                {statementFile && (
                                    <div className="flex items-center space-x-2 text-sm text-green-600 mt-2">
                                        <Check className="h-4 w-4" />
                                        <span className="truncate max-w-[200px]">{statementFile.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trip Selector */}
                        <div className="space-y-2">
                            <Label>Select Trip</Label>
                            <Select value={tripId} onValueChange={setTripId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a trip..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tripsLoading ? (
                                        <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Loading trips...
                                        </div>
                                    ) : (
                                        trips?.map((trip: TripWithStats) => (
                                            <SelectItem key={trip.id} value={trip.id}>
                                                {trip.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">This determines the budget and currency settings.</p>
                        </div>
                    </div>
                )}
                {step === "processing" && (
                    <div className="py-12 flex flex-col items-center space-y-6">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="w-full max-w-md space-y-2">
                            <Progress value={progress} />
                            <p className="text-center text-sm text-muted-foreground">{statusMessage}</p>
                        </div>
                    </div>
                )}

                {step === "review" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Predicted Expenses ({mergedItems.length})</h3>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="gap-1">
                                    <Merge className="h-3 w-3" /> {mergedItems.filter(i => i.source === "merged").length} Merged
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <Receipt className="h-3 w-3" /> {mergedItems.filter(i => i.source === "receipt").length} Receipts
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <CreditCard className="h-3 w-3" /> {mergedItems.filter(i => i.source === "bank").length} Bank
                                </Badge>
                            </div>
                        </div>

                        <ScrollArea className="h-[400px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Source</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Merchant</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Subcategory</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mergedItems.map((item) => {
                                        // Current selected category to filter subcategories
                                        const currentCategory = globalCategories?.find(c => c.id === item.categoryId);
                                        const subcategories = currentCategory?.subcategories || [];

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {item.source === "merged" && <Badge className="bg-purple-500 hover:bg-purple-600">Merged</Badge>}
                                                    {item.source === "receipt" && <Badge className="bg-blue-500 hover:bg-blue-600">Receipt</Badge>}
                                                    {item.source === "bank" && <Badge variant="secondary">Bank</Badge>}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">{item.date}</TableCell>
                                                <TableCell className="font-medium max-w-[200px] truncate" title={item.merchant}>{item.merchant}</TableCell>
                                                <TableCell className="whitespace-nowrap">{item.amount.toFixed(2)} {item.currency}</TableCell>

                                                {/* Category Selector */}
                                                <TableCell className="w-[180px]">
                                                    <Select
                                                        value={item.categoryId}
                                                        onValueChange={(val) => {
                                                            const cat = globalCategories?.find(c => c.id === val);
                                                            updateMergedItem(item.id, {
                                                                categoryId: val,
                                                                categoryName: cat?.name || "",
                                                                subcategoryId: undefined, // Reset subcategory
                                                                subcategoryName: undefined
                                                            });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 w-full">
                                                            <SelectValue placeholder="Category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {globalCategories?.map(c => (
                                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>

                                                {/* Subcategory Selector */}
                                                <TableCell className="w-[180px]">
                                                    <Select
                                                        value={item.subcategoryId || "none"}
                                                        onValueChange={(val) => {
                                                            const subId = val === "none" ? undefined : val;
                                                            const sub = subcategories.find(s => s.id === subId);
                                                            updateMergedItem(item.id, {
                                                                subcategoryId: subId,
                                                                subcategoryName: sub?.name
                                                            });
                                                        }}
                                                        disabled={!item.categoryId || subcategories.length === 0}
                                                    >
                                                        <SelectTrigger className="h-8 w-full">
                                                            <SelectValue placeholder="None" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {subcategories.map(s => (
                                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMergedItem(item.id)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                {step === "upload" && (
                    <Button className="ml-auto" onClick={startProcessing} disabled={receiptFiles.length === 0 && !statementFile}>
                        Start Processing <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
                {step === "review" && (
                    <>
                        <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                        <Button onClick={handleSave}>Approve & Save Expenses</Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
