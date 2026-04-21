"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import FilePreviewDialog from '@/components/FilePreviewDialog';
import { useTranslations } from 'next-intl';
import {
    FileText,
    Download,
    Eye,
    FileImage,
    FileAudio,
    FileVideo,
    Archive,
    File,
    ExternalLink,
    Image as ImageIcon,
    Play,
    Volume2,
    Loader2
} from "lucide-react";

export interface FileAttachment {
    id: string;
    name: string;
    type: 'image' | 'document' | 'audio' | 'video' | 'archive' | 'other';
    size: number;
    url: string;
    thumbnailUrl?: string;
    mimeType?: string;
}

interface FileMessageProps {
    files: FileAttachment[];
    message?: string;
    isCurrentUser?: boolean;
    compact?: boolean;
}

const FileMessage: React.FC<FileMessageProps> = ({
    files,
    message,
    isCurrentUser = false,
    compact = false
}) => {
    const t = useTranslations('chat');
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
    const [showAllFiles, setShowAllFiles] = useState(false);
    const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get file icon
    const getFileIcon = (type: FileAttachment['type'], className = "w-5 h-5") => {
        switch (type) {
            case 'image': return <FileImage className={`${className} text-green-500`} />;
            case 'document': return <FileText className={`${className} text-blue-500`} />;
            case 'audio': return <FileAudio className={`${className} text-purple-500`} />;
            case 'video': return <FileVideo className={`${className} text-red-500`} />;
            case 'archive': return <Archive className={`${className} text-orange-500`} />;
            default: return <File className={`${className} text-gray-500`} />;
        }
    };

    // Get file type badge color
    const getFileTypeBadgeColor = (type: FileAttachment['type']) => {
        switch (type) {
            case 'image': return 'bg-green-100 text-green-800';
            case 'document': return 'bg-blue-100 text-blue-800';
            case 'audio': return 'bg-purple-100 text-purple-800';
            case 'video': return 'bg-red-100 text-red-800';
            case 'archive': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Handle file download
    const handleDownload = async (file: FileAttachment) => {
        if (downloadingFiles.has(file.id)) return;

        try {
            setDownloadingFiles(prev => new Set(prev).add(file.id));
            console.log(t('downloadStarted'), file.name);

            // Use fetch with proper authentication headers
            const response = await fetch(file.url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Token': localStorage.getItem('token') || '',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the file as a blob
            const blob = await response.blob();

            // Create object URL for the blob
            const blobUrl = window.URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.name;

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the blob URL
            window.URL.revokeObjectURL(blobUrl);

            console.log(t('downloadCompleted'), file.name);
        } catch (error) {
            console.error(t('downloadError'), error);

            // Fallback to simple download method
            console.log('Attempting fallback download method...');
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setDownloadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(file.id);
                return newSet;
            });
        }
    };

    // Handle file preview
    const handlePreview = (file: FileAttachment) => {
        setPreviewFile(file);
    };

    // Check if file can be previewed
    const canPreview = (file: FileAttachment) => {
        return ['image', 'video', 'audio', 'document'].includes(file.type);
    };

    // Display logic for multiple files
    const displayFiles = showAllFiles ? files : files.slice(0, 3);
    const hasMoreFiles = files.length > 3 && !showAllFiles;

    return (
        <>
            <div className={`space-y-3 ${isCurrentUser ? 'max-w-lg' : 'w-fit'}`}>
                {/* Message text if provided */}
                {message && (
                    <div className={`text-sm mb-2 ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                        {message}
                    </div>
                )}

                {/* Files display */}
                <div className="space-y-2">
                    {/* Image grid for images */}
                    {files.filter(f => f.type === 'image').length > 0 && (
                        <div className="flex flex-wrap gap-1 w-fit">
                            {files.filter(f => f.type === 'image').slice(0, 4).map((file, index) => {
                                const imageCount = files.filter(f => f.type === 'image').length;
                                return (
                                    <div
                                        key={file.id}
                                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 border-white shadow-sm ${imageCount === 1 ? 'w-64 h-64' :
                                            imageCount === 2 ? 'w-40 h-40' :
                                                'w-32 h-32'
                                            }`}
                                        onClick={() => handlePreview(file)}
                                    >
                                        <img
                                            src={file.thumbnailUrl || file.url}
                                            alt={file.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        {/* Overlay for additional images */}
                                        {index === 3 && files.filter(f => f.type === 'image').length > 4 && (
                                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    +{files.filter(f => f.type === 'image').length - 4}
                                                </span>
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white bg-opacity-20 rounded-full p-2">
                                                <Eye className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        {/* File size badge */}
                                        <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Non-image files */}
                    {displayFiles.filter(f => f.type !== 'image').map((file) => (
                        <Card key={file.id} className={`border shadow-sm hover:shadow-md transition-shadow w-fit min-w-80 ${isCurrentUser ? 'bg-white bg-opacity-10 border-white border-opacity-20' : ''
                            }`}>
                            <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                    {/* File icon */}
                                    <div className="flex-shrink-0">
                                        {getFileIcon(file.type, "w-8 h-8")}
                                    </div>

                                    {/* File info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-900'
                                                }`} title={file.name}>
                                                {file.name}
                                            </p>
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${isCurrentUser
                                                    ? 'bg-white bg-opacity-20 text-white border-white border-opacity-30'
                                                    : getFileTypeBadgeColor(file.type)
                                                    }`}
                                            >
                                                {file.type.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className={`text-xs ${isCurrentUser ? 'text-white text-opacity-80' : 'text-gray-500'
                                            }`}>
                                            {formatFileSize(file.size)}
                                            {file.mimeType && (
                                                <span className="ml-1">• {file.mimeType.split('/')[1]?.toUpperCase()}</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {canPreview(file) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePreview(file)}
                                                title={t("preview")}
                                                className={`h-8 w-8 p-0 ${isCurrentUser
                                                    ? 'hover:bg-white hover:bg-opacity-20 text-white'
                                                    : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(file)}
                                            disabled={downloadingFiles.has(file.id)}
                                            title={downloadingFiles.has(file.id) ? t("uploading") : t("download")}
                                            className={`h-8 w-8 p-0 ${isCurrentUser
                                                ? 'hover:bg-white hover:bg-opacity-20 text-white'
                                                : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            {downloadingFiles.has(file.id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Total file count */}
                    {files.length > 1 && (
                        <div className={`text-xs text-center py-1 px-2 rounded w-fit ${isCurrentUser
                            ? 'text-white text-opacity-80 bg-white bg-opacity-10'
                            : 'text-gray-500 bg-gray-50'
                            }`}>
                            📎 {t("fileCount", {
                                count: files.length, size: formatFileSize(
                                    files.reduce((total, file) => total + file.size, 0)
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Advanced File Preview Dialog */}
            {previewFile && (
                <FilePreviewDialog
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    file={previewFile}
                />
            )}
        </>
    );
};

export default FileMessage;