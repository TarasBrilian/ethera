"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
// import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther, formatUnits } from "viem";
// import { usePreviewDeposit } from "@/hooks/usePreviewDeposit";
// import { useDeposit } from "@/hooks/useDeposit";

function formatTokenAmount(value: bigint, decimals: number = 18): string {
    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// --- MOCK HOOKS ---

const useAccount = () => ({
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    isConnected: true
});

const useBalance = (_args: any) => ({
    data: {
        value: parseEther("100"),
        symbol: "ETH",
        decimals: 18
    }
});

const usePreviewDeposit = (amountString: string) => {
    const [preview, setPreview] = useState<{
        etheraAmount: bigint | undefined;
        ethUsdPrice: bigint | undefined;
        etheraUsdPrice: bigint | undefined;
        isLoading: boolean;
    }>({
        etheraAmount: undefined,
        ethUsdPrice: undefined,
        etheraUsdPrice: undefined,
        isLoading: false
    });

    useEffect(() => {
        // Mock prices: ETH = $3000, ETHERA = $1
        const ethPrice = parseEther("3000");
        const etheraPrice = parseEther("1");

        if (!amountString || parseFloat(amountString) === 0) {
            setPreview({
                etheraAmount: undefined,
                ethUsdPrice: ethPrice,
                etheraUsdPrice: etheraPrice,
                isLoading: false
            });
            return;
        }

        setPreview(prev => ({ ...prev, isLoading: true }));

        const timeout = setTimeout(() => {
            try {
                const amount = parseEther(amountString);
                // Calculate max LTV amount (66.66% of value)
                // Value = amount * 3000
                // MaxStake = Value * 2/3 = amount * 2000
                // etheraAmount = MaxStake / 1 = amount * 2000
                const etheraAmt = amount * BigInt(2000);

                setPreview({
                    etheraAmount: etheraAmt,
                    ethUsdPrice: ethPrice,
                    etheraUsdPrice: etheraPrice,
                    isLoading: false
                });
            } catch {
                setPreview(prev => ({ ...prev, isLoading: false }));
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timeout);
    }, [amountString]);

    return preview;
}

const useDeposit = () => {
    const [status, setStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const deposit = (amount: string) => {
        setStatus("pending");
        setTimeout(() => {
            setStatus("confirming");
            setTimeout(() => {
                setStatus("success");
                setTxHash("0x" + Array(64).fill("0").map(() => Math.floor(Math.random() * 16).toString(16)).join(""));
            }, 2000);
        }, 1500);
    };

    const reset = () => {
        setStatus("idle");
        setTxHash(null);
        setError(null);
    };

    return {
        deposit,
        isPending: status === "pending",
        isConfirming: status === "confirming",
        isSuccess: status === "success",
        error,
        txHash,
        reset
    };
};

export default function StakeCard() {
    const { address, isConnected } = useAccount();
    const { data: balanceData } = useBalance({
        address: address,
    });

    const [amount, setAmount] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

    const MAX_LTV = 66.666666;

    const [sliderPercent, setSliderPercent] = useState<number>(MAX_LTV);

    const {
        etheraAmount,
        ethUsdPrice,
        etheraUsdPrice,
        isLoading: isPreviewLoading
    } = usePreviewDeposit(amount);

    const {
        deposit,
        isPending,
        isConfirming,
        isSuccess,
        error: depositError,
        txHash,
        reset
    } = useDeposit();

    useEffect(() => {
        if (isSuccess && txHash) {
            setSuccessTxHash(txHash);
            setShowSuccessModal(true);

            setTimeout(() => {
                setAmount("");
                setSliderPercent(MAX_LTV);
                reset();
            }, 3000);
        }
    }, [isSuccess, txHash, reset]);

    useEffect(() => {
        if (showSuccessModal) {
            const timer = setTimeout(() => {
                setShowSuccessModal(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal]);

    useEffect(() => {
        if (!amount || !balanceData) {
            setError(null);
            return;
        }

        try {
            const inputAmount = parseEther(amount);
            const balanceAmount = balanceData.value;
            const minAmount = parseEther("0.001");

            if (inputAmount > balanceAmount) {
                setError("Insufficient balance");
            } else if (inputAmount < minAmount) {
                setError("Minimum stake is 0.001 ETH");
            } else {
                setError(null);
            }
        } catch {
            setError(null);
        }
    }, [amount, balanceData]);

    const handleMaxClick = () => {
        if (balanceData) {
            const ethValue = parseFloat(formatEther(balanceData.value));
            setAmount(ethValue.toFixed(6));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        const clampedValue = Math.min(value, MAX_LTV);
        setSliderPercent(clampedValue);
    };

    const handleStake = () => {
        if (amount && parseFloat(amount) > 0) {
            setSuccessTxHash(null);
            deposit(amount);
        }
    };

    const isStakeDisabled = !isConnected || !amount || !!error || parseFloat(amount) <= 0 || isPending || isConfirming;

    const showSlider = !!(amount && parseFloat(amount) > 0 && etheraAmount);

    const adjustedEtheraAmount = etheraAmount
        ? (etheraAmount * BigInt(Math.floor((sliderPercent / MAX_LTV) * 10000))) / BigInt(10000)
        : undefined;

    const formattedEtheraAmount = adjustedEtheraAmount
        ? formatTokenAmount(adjustedEtheraAmount, 18)
        : "";

    const exchangeRate = ethUsdPrice && etheraUsdPrice && etheraUsdPrice > BigInt(0)
        ? (Number(ethUsdPrice) / Number(etheraUsdPrice)).toFixed(4)
        : null;

    const getButtonText = () => {
        if (!isConnected) return "Connect Wallet to Stake";
        if (error) return error;
        if (isPending) return "Confirm in Wallet...";
        if (isConfirming) return "Confirming...";
        if (isSuccess) return "Staked!";
        return "Stake";
    };

    return (
        <div className="w-full max-w-md mx-auto relative px-4">
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed top-24 right-4 z-[100]"
                    >
                        <div className="bg-[#1A1A18] border border-white/10 rounded-sm p-5 w-72 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-[#C9A84C]/10 rounded-full shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-[#C9A84C]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-[#F5F5F0]">Success</h3>
                                    <p className="text-[10px] text-[#9A9A8E] font-bold uppercase tracking-[0.2em]">ETHERA Money</p>
                                </div>
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            {successTxHash && (
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${successTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 py-2.5 px-4 bg-black/40 hover:bg-black transition-colors rounded-sm text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] border border-[#C9A84C]/20"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    View Transaction
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-[#F5F5F0] mb-3 tracking-tight">Mint TPPU</h1>
                <p className="text-[#9A9A8E] text-sm uppercase tracking-widest font-medium">Thera Purchasing Power Unit</p>
            </div>

            <div className="bg-[#1A1A18] border border-white/5 rounded-sm p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A84C] opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A9A8E]">Deposit ETH</label>
                            <span className="text-[10px] text-zinc-500">
                                Balance: {balanceData ? `${parseFloat(formatEther(balanceData.value)).toFixed(4)}` : '0.00'}
                            </span>
                        </div>
                        <div className={`bg-black/40 border transition-all duration-300 rounded-sm px-5 py-4 flex items-center justify-between ${error ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-6 h-6 shrink-0 grayscale group-hover:grayscale-0 transition-all opacity-60">
                                    <Image src="/ethereum-eth.svg" alt="ETH" width={48} height={48} className="w-full h-full object-contain" />
                                </div>
                                <input
                                    type="text"
                                    className="bg-transparent border-none outline-none text-2xl font-medium text-[#F5F5F0] placeholder-zinc-700 w-full min-w-0"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={handleInputChange}
                                    disabled={isPending || isConfirming}
                                />
                            </div>
                            <button
                                onClick={handleMaxClick}
                                disabled={isPending || isConfirming}
                                className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/5 border border-[#C9A84C]/20 px-4 py-2 rounded-sm hover:bg-[#C9A84C]/10 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                Max
                            </button>
                        </div>
                        {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{error}</p>}
                    </div>

                    <div className="relative flex justify-center py-2">
                        <div className="h-px bg-white/5 w-full absolute top-1/2 -translate-y-1/2" />
                        <div className="bg-[#1A1A18] border border-white/5 rounded-full p-2 relative z-10 text-[#9A9A8E] transform hover:rotate-180 transition-transform duration-500">
                            <ArrowUpDown className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A9A8E] ml-1">Receive TPPU</label>
                        <div className="bg-black/40 border border-white/5 rounded-sm px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-6 h-6 shrink-0 relative">
                                    <div className="absolute inset-0 bg-[#C9A84C]/20 blur-sm rounded-full" />
                                    <Image src="/image.png" alt="ETHERA" width={48} height={48} className="w-full h-full object-contain relative z-10" />
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        className="bg-transparent border-none outline-none text-2xl font-medium text-[#C9A84C] placeholder-zinc-800 w-full min-w-0"
                                        placeholder="0.00"
                                        readOnly
                                        value={formattedEtheraAmount}
                                    />
                                    {isPreviewLoading && amount && parseFloat(amount) > 0 && (
                                        <Loader2 className="w-5 h-5 text-[#C9A84C]/40 animate-spin" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${showSlider ? "max-h-[200px] mb-8" : "max-h-0 mb-0"}`}
                    >
                        <div className="pt-6 space-y-4 border-t border-white/5 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A9A8E]">Collateral Ratio</span>
                                <span className="text-[10px] font-bold text-[#C9A84C] px-3 py-1 bg-[#C9A84C]/10 rounded-sm border border-[#C9A84C]/20">
                                    {((sliderPercent / MAX_LTV) * 150).toFixed(2)}%
                                </span>
                            </div>
                            <div className="relative w-full h-8 flex items-center group/slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={sliderPercent}
                                    onChange={handleSliderChange}
                                    className="slider-stake w-full z-20 relative cursor-pointer"
                                    style={{ '--slider-progress': `${sliderPercent}%` } as React.CSSProperties}
                                    disabled={isPending || isConfirming}
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-red-500/40 z-10 pointer-events-none" style={{ left: `${MAX_LTV}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-[#9A9A8E]/40">
                                <span>Minimum</span>
                                <span className="text-[#C9A84C]/60 text-center">Protocol Safety Limit (66.67%)</span>
                                <span>Max</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStake}
                        disabled={isStakeDisabled}
                        className={`w-full font-bold text-xs uppercase tracking-[0.2em] py-5 rounded-sm transition-all duration-500 transform flex items-center justify-center gap-3 ${isStakeDisabled ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#C9A84C] text-[#0E0E0E] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] shadow-[0_0_20px_rgba(201,168,76,0.1)] active:scale-[0.98]'}`}
                    >
                        {(isPending || isConfirming) && <Loader2 className="w-5 h-5 animate-spin" />}
                        {getButtonText()}
                    </button>

                    <div className="pt-8 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A9A8E]">
                            <span>Stable Rate</span>
                            <span className="text-[#F5F5F0]">0.00%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A9A8E]">
                            <span>Exchange Rate</span>
                            <span className="text-[#F5F5F0]">{ethUsdPrice ? `$${parseFloat(formatUnits(ethUsdPrice, 18)).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : "—"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                    Backed by hardened ETH collateral & Chainlink oracles
                </p>
            </div>
        </div>
    );
}
