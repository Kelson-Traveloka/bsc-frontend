"use client";
import { useState, useEffect } from "react";

export default function FollowTooltip({
    text,
    visible,
}: {
    text: string;
    visible: boolean;
}) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX + 7, y: e.clientY - 20 });
        };

        if (visible) {
            window.addEventListener("mousemove", handleMouseMove);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
        }

        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [visible]);

    if (!visible) return null;

    return (
        <div
            className="fixed z-100 px-3 py-1 text-xs bg-gray-900/70 backdrop-blur-sm text-white rounded-md shadow-lg pointer-events-none transition-opacity duration-150"
            style={{
                top: position.y,
                left: position.x,
            }}
        >
            {text}
        </div>
    );
}
