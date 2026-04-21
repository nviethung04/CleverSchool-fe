"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    autoClose?: boolean; // New prop to control auto-close behavior
    onClearLast?: () => void; // New prop for clearing last emoji
}

const EMOJI_CATEGORIES = {
    "Smileys & People": [
        "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
        "😋", "😎", "😍", "🥰", "😘", "🥲", "😗", "😙", "😚", "🙂",
        "🤗", "🤩", "🤔", "🫡", "😐", "😑", "😶", "🙄", "😏", "😣",
        "😥", "😮", "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😛",
        "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🫠", "🤑",
        "😲", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴",
        "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
        "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥",
        "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱"
    ],
    "Animals & Nature": [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
        "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
        "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
        "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
        "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕"
    ],
    "Food & Drink": [
        "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈",
        "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦",
        "🥒", "🌶️", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐",
        "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇"
    ],
    "Activities": [
        "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓",
        "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹",
        "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿"
    ],
    "Objects": [
        "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️",
        "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥",
        "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️"
    ]
};

export function EmojiPicker({ onEmojiSelect, isOpen, onClose, triggerRef, autoClose = true, onClearLast }: EmojiPickerProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("Smileys & People");
    const [searchTerm, setSearchTerm] = useState("");
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    // Filter emojis based on search term
    const getFilteredEmojis = () => {
        const emojis = EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];
        if (!searchTerm.trim()) return emojis;

        // Simple search - could be enhanced with emoji names/descriptions
        return emojis.filter(emoji => {
            // Add some basic emoji-to-keyword mapping for better search
            const emojiKeywords: { [key: string]: string[] } = {
                "😀": ["smile", "happy", "vui", "cười"],
                "😍": ["love", "heart", "yêu", "tim"],
                "😂": ["laugh", "funny", "cười", "vui"],
                "👍": ["thumb", "good", "tốt", "like"],
                "❤️": ["heart", "love", "yêu", "tim"],
                "🎉": ["party", "celebrate", "tiệc", "chúc mừng"],
                // Add more mappings as needed
            };

            const keywords = emojiKeywords[emoji] || [];
            return keywords.some(keyword =>
                keyword.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    };

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-2 duration-200"
        >
            {/* Header */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-gray-900">Chọn emoji</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Tìm emoji..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {!autoClose && onClearLast && (
                        <button
                            onClick={onClearLast}
                            className="px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                            title="Xóa emoji cuối"
                        >
                            ⌫
                        </button>
                    )}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                            "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors min-w-fit",
                            selectedCategory === category
                                ? "border-blue-500 text-blue-600 bg-white"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        )}
                    >
                        {category.split(" ")[0]}
                    </button>
                ))}
            </div>

            {/* Emoji Grid */}
            <div className="p-3 h-48 overflow-y-auto bg-white">
                <div className="grid grid-cols-8 gap-1">
                    {getFilteredEmojis().map((emoji, index) => (
                        <button
                            key={`${emoji}-${index}`}
                            onClick={() => {
                                onEmojiSelect(emoji);
                                // Only auto-close if autoClose is true
                                if (autoClose) {
                                    onClose();
                                }
                            }}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-blue-50 rounded transition-colors duration-150 hover:scale-110 transform"
                            title={emoji}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                {getFilteredEmojis().length === 0 && searchTerm && (
                    <div className="text-center text-gray-500 text-sm py-8">
                        Không tìm thấy emoji nào
                    </div>
                )}
            </div>

            {/* Recent/Frequent Emojis */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">Gần đây</p>
                    {!autoClose && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            💡 Nhấn X để đóng
                        </div>
                    )}
                </div>
                <div className="flex gap-1">
                    {["😀", "😊", "😂", "🥲", "😍", "👍", "❤️", "🎉"].map((emoji, index) => (
                        <button
                            key={`recent-${emoji}-${index}`}
                            onClick={() => {
                                onEmojiSelect(emoji);
                                // Only auto-close if autoClose is true
                                if (autoClose) {
                                    onClose();
                                }
                            }}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-blue-50 rounded transition-colors duration-150 hover:scale-110 transform"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}