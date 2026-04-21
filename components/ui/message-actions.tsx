"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Reply,
    MoreHorizontal,
    Copy,
    Pin,
    PinOff,
    Trash2
} from 'lucide-react';

interface MessageActionsProps {
    messageId: string;
    content: string;
    isPinned?: boolean;
    isCurrentUser: boolean;
    onReply: (messageId: string) => void;
    onCopy: (content: string) => void;
    onPin: (messageId: string) => void;
    onUnpin: (messageId: string) => void;
    onDelete: (messageId: string) => void;
}

export function MessageActions({
    messageId,
    content,
    isPinned = false,
    isCurrentUser,
    onReply,
    onCopy,
    onPin,
    onUnpin,
    onDelete
}: MessageActionsProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        onCopy(content);
        setShowDropdown(false);
    };

    const handlePin = () => {
        if (isPinned) {
            onUnpin(messageId);
        } else {
            onPin(messageId);
        }
        setShowDropdown(false);
    };

    const handleDelete = () => {
        // Remove confirmation dialog here since it's handled in the parent component
        onDelete(messageId);
        setShowDropdown(false);
    };

    const handleReply = () => {
        onReply(messageId);
    };

    return (
        <div className="message-actions flex items-center gap-1">
            {/* Reply Button */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                onClick={handleReply}
                title="Trả lời"
            >
                <Reply className="w-4 h-4" />
            </Button>

            {/* More Options Button */}
            <div className="relative" ref={dropdownRef}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    onClick={() => setShowDropdown(!showDropdown)}
                    title="Tùy chọn khác"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </Button>

                {/* Dropdown Menu */}
                {showDropdown && (
                    <div className={`dropdown-menu absolute top-8 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${isCurrentUser ? 'right-0' : 'left-0'
                        }`}>
                        {/* Copy Message */}
                        <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            onClick={handleCopy}
                        >
                            <Copy className="w-4 h-4" />
                            Sao chép tin nhắn
                        </button>

                        {/* Pin/Unpin Message */}
                        <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            onClick={handlePin}
                        >
                            {isPinned ? (
                                <>
                                    <PinOff className="w-4 h-4" />
                                    Bỏ ghim tin nhắn
                                </>
                            ) : (
                                <>
                                    <Pin className="w-4 h-4" />
                                    Ghim tin nhắn
                                </>
                            )}
                        </button>

                        {/* Delete Message - Only for current user's messages */}
                        {isCurrentUser && (
                            <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4" />
                                Xóa tin nhắn
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}