"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

interface MobileOrientationGuardProps {
    children: React.ReactNode;
    requireLandscape?: boolean;
}

export default function MobileOrientationGuard({
    children,
    requireLandscape = true
}: MobileOrientationGuardProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const t = useTranslations("assignments");

    useEffect(() => {
        const checkDevice = () => {
            if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
        
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isIPadNew = isTouchDevice && screen.width >= 768 && screen.width <= 1024;
        
            const isMobileDevice =
                /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                /iPad/i.test(userAgent) ||
                isIPadNew;
        
            const isMobileScreen = window.innerWidth <= 768;

            const mobile = isMobileDevice || isMobileScreen
            
            setIsMobile(mobile);

            if (mobile && requireLandscape) {
                // Check orientation
                const portrait = window.innerHeight > window.innerWidth;
                setIsPortrait(portrait);
                setShowWarning(portrait);
            } else {
                setIsPortrait(false);
                setShowWarning(false);
            }
        };

        // Initial check
        checkDevice();

        // Listen for resize and orientation changes
        window.addEventListener('resize', checkDevice);
        window.addEventListener('orientationchange', () => {
            // Delay to ensure orientation change is complete
            setTimeout(checkDevice, 100);
        });

        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, [requireLandscape]);

    // If not mobile or not requiring landscape, show children normally
    if (!isMobile || !requireLandscape) {
        return <>{children}</>;
    }

    // If mobile and in portrait mode, show orientation warning
    if (showWarning) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-blue-200">
                    {/* Icon Animation */}
                    <div className="relative mb-6">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                <RotateCcw className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-800 mb-3">
                        {t("rotatePhone")}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {t("rotateLandscapeMessage")}
                    </p>

                    {/* Visual Guide */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-12 bg-gray-300 rounded-lg mb-2 relative">
                                <div className="absolute inset-1 bg-gray-100 rounded"></div>
                            </div>
                            <span className="text-xs text-gray-500">{t("portrait")}</span>
                        </div>

                        <RotateCcw className="w-6 h-6 text-blue-500 animate-pulse" />

                        <div className="flex flex-col items-center">
                            <div className="w-12 h-8 bg-blue-500 rounded-lg mb-2 relative">
                                <div className="absolute inset-1 bg-blue-100 rounded"></div>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">{t("landscape")}</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm text-blue-800">
                            {t("rotateInstructions")}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile in landscape mode, show children
    return <>{children}</>;
}