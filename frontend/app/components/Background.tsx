"use client";

export default function Background() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none">
            <div className="absolute inset-0 bg-[#050200]" />

            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: "radial-gradient(circle at 50% 50%, rgba(115, 75, 22, 0.2) 0%, transparent 70%)"
                }}
            />

            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background: "radial-gradient(circle at 80% 90%, rgba(115, 75, 22, 0.15), transparent 50%)"
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.1]"
                style={{
                    backgroundImage: "url('/noise.svg')",
                    backgroundSize: "150px 150px",
                    filter: "contrast(120%) brightness(100%)"
                }}
            />
        </div>
    );
}
