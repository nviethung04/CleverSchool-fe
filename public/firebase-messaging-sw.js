// This a service worker file for receiving FCM notifications when app is in background
// Copy this file to /public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyCNnVsg-4hdD7STtZHptGMIkH613g7LUsw",
    authDomain: "ed-lms.firebaseapp.com",
    projectId: "ed-lms",
    storageBucket: "ed-lms.firebasestorage.app",
    messagingSenderId: "574072475726",
    appId: "1:574072475726:web:2a0dc365c91dc389fa331f",
    measurementId: "G-LL7ZX9LKPN"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// QUAN TRỌNG: Skip waiting để SW mới replace SW cũ ngay lập tức
self.addEventListener('install', (event) => {
    console.log('[SW] 📦 Service Worker installing...');
    self.skipWaiting(); // Force SW mới active ngay
});

// QUAN TRỌNG: Claim clients ngay khi SW activate để control page
self.addEventListener('activate', (event) => {
    console.log('[SW] 🔥 Service Worker activating...');
    event.waitUntil(
        clients.claim().then(() => {
            console.log('[SW] ✅ Clients claimed! SW now controls all pages.');
        })
    );
});

console.log("[SW] 🚀 Firebase Messaging Service Worker initializing...");

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log("[SW] ===== BACKGROUND MESSAGE RECEIVED =====");
    console.log("[SW] Payload:", JSON.stringify(payload, null, 2));

    const notificationTitle = payload.notification?.title || "Thông báo mới";
    console.log("[SW] Title:", notificationTitle);

    const notificationOptions = {
        body: payload.notification?.body || "",
        icon: payload.notification?.icon || "/logo-urp.png",
        badge: "/logo-urp.png",
        image: payload.notification?.image || null,
        data: payload.data,
        tag: payload.data?.id || "notification",
        requireInteraction: true,
        actions: [
            {
                action: "open",
                title: "Xem ngay"
            },
            {
                action: "close",
                title: "Đóng"
            }
        ],
        timestamp: Date.now(),
    };

    console.log("[SW] Notification options:", JSON.stringify(notificationOptions, null, 2));
    console.log("[SW] Calling showNotification...");

    return self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
            console.log("[SW] ✅ Notification shown successfully!");
        })
        .catch((error) => {
            console.error("[SW] ❌ Error showing notification:", error);
        });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
    console.log("[firebase-messaging-sw.js] Notification clicked:", event);

    const action = event.action;
    const notification = event.notification;
    const data = notification.data || {};

    notification.close();

    // Nếu user click "Đóng"
    if (action === "close") {
        return;
    }

    // Nếu user click "Xem ngay" hoặc click vào notification
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Xác định URL cần mở dựa trên data
            let targetUrl = "/";

            if (data.url) {
                targetUrl = data.url;
            } else if (data.type) {
                // Route theo loại thông báo
                switch (data.type) {
                    case "notice":
                        targetUrl = "/vi/admin/notices";
                        break;
                    case "assignment":
                        targetUrl = `/vi/assignments/${data.id}`;
                        break;
                    case "course":
                        targetUrl = `/vi/courses/${data.id}`;
                        break;
                    case "class":
                        targetUrl = `/vi/classes/${data.id}`;
                        break;
                    default:
                        targetUrl = "/";
                }
            }

            // Nếu app đang mở, focus và navigate
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.postMessage({
                        type: "NOTIFICATION_CLICK",
                        url: targetUrl,
                        data: data
                    });
                    return client.focus();
                }
            }

            // Nếu không có window nào mở, mở window mới
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// QUAN TRỌNG: Thêm fetch handler để SW không bị terminate
// Fetch handler này giữ SW active và cho phép showNotification() hoạt động
self.addEventListener('fetch', (event) => {
    // Pass through - không can thiệp vào network requests
    // Chỉ cần có fetch handler là đủ để SW được coi là "có chức năng"
    return;
});

console.log("[SW] ✅ Firebase Messaging Service Worker loaded with fetch handler");
