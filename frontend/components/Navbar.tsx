"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from "next/link";
import { Settings, LogOut, Copy, Network, Menu } from "lucide-react";
import { useDisconnect } from 'wagmi';
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { label: 'Stake', href: '/stake' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Operators', href: '/operators' },
    { label: 'Earn', href: '/earn' },
];

function WalletMenu({
    openChainModal,
    account,
    isMobile = false,
}: {
    openChainModal: () => void;
    account: { address: string; displayName: string };
    isMobile?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { disconnect } = useDisconnect();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const copyAddress = () => {
        navigator.clipboard.writeText(account.address);
        setIsOpen(false);
    };

    const handleDisconnect = () => {
        disconnect();
        setIsOpen(false);
    };

    const handleNetworkSwitch = () => {
        openChainModal();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="p-2.5 rounded-sm bg-black/40 backdrop-blur-sm hover:bg-[#C9A84C]/10 text-zinc-400 hover:text-[#C9A84C] transition-all border border-[#C9A84C]/20 hover:border-[#C9A84C]/40 shadow-[0_0_15px_-3px_rgba(201,168,76,0.1)] cursor-pointer group"
            >
                {isMobile ? (
                    <Menu className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'text-[#C9A84C]' : ''}`} />
                ) : (
                    <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90 text-[#C9A84C]' : 'group-hover:rotate-45'}`} />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-sm bg-black/90 backdrop-blur-xl border border-[#C9A84C]/20 shadow-[0_0_30px_-5px_rgba(201,168,76,0.15)] py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {isMobile && (
                        <>
                            <div className="px-4 py-2 border-b border-[#C9A84C]/10 mb-1">
                                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Navigation</p>
                            </div>
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <div className="h-px bg-[#C9A84C]/10 my-1 mx-2"></div>
                        </>
                    )}

                    <div className="px-4 py-3 border-b border-[#C9A84C]/10 mb-1">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Connected as</p>
                        <p className="text-sm font-bold text-zinc-200 truncate">{account.displayName}</p>
                    </div>

                    <button
                        onClick={handleNetworkSwitch}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors flex items-center gap-3"
                    >
                        <Network className="w-4 h-4" />
                        Switch Network
                    </button>

                    <button
                        onClick={copyAddress}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors flex items-center gap-3"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Address
                    </button>

                    <div className="h-px bg-[#C9A84C]/10 my-1 mx-2"></div>

                    <button
                        onClick={handleDisconnect}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                    >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (pathname === "/") return null;

    return (
        <nav className={`flex items-center justify-between px-10 py-6 sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-md bg-[#0E0E0E]/80 border-b border-white/5' : 'bg-transparent'}`}>
            <div className="flex items-center gap-12">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#C9A84C]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Image src="/ethera.png" alt="Logo" width={32} height={32} className="relative z-10" />
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`relative transition-colors duration-300 group ${isActive(item.href) ? 'text-[#C9A84C]' : 'text-zinc-500 hover:text-[#C9A84C]'
                                }`}
                        >
                            {item.label}
                            <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#C9A84C] transition-all duration-300 ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                                }`}></span>
                        </Link>
                    ))}
                </div>
            </div>


            <ConnectButton.Custom>
                {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                }) => {
                    const ready = mounted && authenticationStatus !== 'loading';
                    const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                            authenticationStatus === 'authenticated');

                    return (
                        <div
                            {...(!ready && {
                                'aria-hidden': true,
                                'style': {
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                },
                            })}
                        >
                            {(() => {
                                if (!connected) {
                                    return (
                                        <button onClick={openConnectModal} type="button" className="px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[#C9A84C] text-[#0E0E0E] hover:bg-[#D4B96A] transition-all cursor-pointer">
                                            Connect Wallet
                                        </button>
                                    );
                                }

                                if (chain.unsupported) {
                                    return (
                                        <button onClick={openChainModal} type="button" className="px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20">
                                            Wrong network
                                        </button>
                                    );
                                }

                                return (
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-sm text-[10px] shadow-[0_0_15px_-3px_rgba(201,168,76,0.1)] border border-[#C9A84C]/20 bg-black/40 backdrop-blur-sm">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_rgba(201,168,76,0.8)] animate-pulse"></div>
                                            <span className="text-zinc-200 font-medium">
                                                {account.displayBalance
                                                    ? account.displayBalance
                                                    : ''}
                                            </span>
                                            <span className="bg-[#C9A84C]/10 px-2 py-0.5 rounded text-[#C9A84C] text-[10px] font-bold border border-[#C9A84C]/20">
                                                {account.displayName}
                                            </span>
                                        </div>

                                        <div className="hidden md:block">
                                            <WalletMenu
                                                openChainModal={openChainModal}
                                                account={account}
                                            />
                                        </div>

                                        <div className="md:hidden">
                                            <WalletMenu
                                                openChainModal={openChainModal}
                                                account={account}
                                                isMobile={true}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                }}
            </ConnectButton.Custom>
        </nav>
    );
}
