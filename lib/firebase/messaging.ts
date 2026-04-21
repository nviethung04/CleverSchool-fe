
// DISABLED: Firebase Cloud Messaging not used for browser push notifications
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./config";
import { RegisterFCMToken, UnregisterFCMToken } from "@/lib/api/users";

// VAPID Key from environment variable
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

if (false && !VAPID_KEY && typeof window !== "undefined") {
    console.warn("⚠️ VAPID key not found! Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local");
    console.warn("📚 See FIREBASE_SETUP.md for instructions");
}

/**
 * Request permission và lấy FCM token - DISABLED
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
    console.log("FCM disabled");
    return null;

    /* ORIGINAL CODE - DISABLED
    try {
        if (!messaging) {
            console.warn("Firebase Messaging not supported on this browser");
            return null;
        }

        // QUAN TRỌNG: Đợi Service Worker sẵn sàng trước
        if ('serviceWorker' in navigator) {
            console.log("⏳ Waiting for Service Worker to be ready...");
            await navigator.serviceWorker.ready;
            console.log("✅ Service Worker is ready!");
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            // Get FCM token
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
            });

            if (token) {
                console.log("FCM Token:", token);
                return token;
            } else {
                console.log("No registration token available.");
                return null;
            }
        } else {
            console.log("Notification permission denied.");
            return null;
        }
    } catch (error) {
        console.error("An error occurred while retrieving token:", error);
        return null;
    }
};

/**
 * Lắng nghe foreground messages - DISABLED
 * Trả về unsubscribe function để cleanup
 */
    export const onMessageListener = (callback: (payload: any) => void) => {
        console.log("FCM disabled");
        return () => { };

        /* ORIGINAL CODE - DISABLED
                console.warn("❌ Firebase Messaging not available");
                return () => { };
            }
    
            console.log("🎧 Setting up onMessage listener...");
    
            // onMessage tự động lắng nghe liên tục
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log("📨 Message received in foreground:", payload);
                callback(payload);
            });
    
            console.log("✅ onMessage listener setup complete");
    
            return unsubscribe;
        };
    
        /**
     * Save FCM token to backend - DISABLED
     * Backend sẽ tự động subscribe vào topics (all_system, school_{id}, etc.)
     */
        export const saveFCMTokenToBackend = async (token: string) => {
            console.log("FCM disabled");
            return;

            /* ORIGINAL CODE - DISABLED
                    // Call API to register device token
                    // Backend sẽ tự động subscribe vào topics dựa trên user info
                    await RegisterFCMToken(token);
        
                    console.log("✅ FCM token registered to backend:", token);
        
                    // Lưu vào localStorage để tránh request lại
                    localStorage.setItem("fcm_token", token);
                    localStorage.setItem("fcm_token_registered", "true");
                } catch (error) {
                    console.error("❌ Error saving FCM token:", error);
                    throw error;
                }
            };
        
            /**
             * Check if FCM token exists in localStorage - DISABLED
             */
            export const getFCMTokenFromStorage = (): string | null => {
                console.log("FCM disabled");
                return null;

                /* ORIGINAL CODE - DISABLED
                if (typeof window === "undefined") return null;
                return localStorage.getItem("fcm_token");
                */
            };

            /**
             * Check if FCM token is registered - DISABLED
             */
            export const isFCMTokenRegistered = (): boolean => {
                console.log("FCM disabled");
                return false;

                /* ORIGINAL CODE - DISABLED
                if (typeof window === "undefined") return false;
                return localStorage.getItem("fcm_token_registered") === "true";
                */
            };

            /**
         * Unregister FCM token (khi logout) - DISABLED
         * Backend sẽ tự động unsubscribe khỏi tất cả topics
         */
            export const unregisterFCMToken = async () => {
                console.log("FCM disabled");
                return;

                /* ORIGINAL CODE - DISABLED
                        const token = getFCMTokenFromStorage();
                        if (!token) {
                            console.log("No FCM token to unregister");
                            return;
                        }
            
                        // Call API to unregister
                        // Backend sẽ tự động unsubscribe khỏi tất cả topics
                        await UnregisterFCMToken(token);
            
                        // Clear localStorage
                        localStorage.removeItem("fcm_token");
                        localStorage.removeItem("fcm_token_registered");
            
                        console.log("✅ FCM token unregistered successfully");
                    } catch (error) {
                        console.error("❌ Error unregistering FCM token:", error);
                    }
                };
            
                /**
             * Initialize FCM for web - DISABLED
             */
                export const initializeFCM = async () => {
                    console.log("FCM disabled");
                    return null;

/* ORIGINAL CODE - DISABLED
        // Check if already has token and registered
        const existingToken = getFCMTokenFromStorage();
        const isRegistered = isFCMTokenRegistered();

        if (existingToken && isRegistered) {
            console.log("✅ FCM already initialized with token:", existingToken);
            return existingToken;
        }

        // Request new token
        const token = await requestNotificationPermission();
        if (token) {
            await saveFCMTokenToBackend(token);
            return token;
        }

        return null;
    } catch (error) {
        console.error("❌ Error initializing FCM:", error);
        return null;
    }
};
