"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import {
    Download,
    ZoomIn,
    ZoomOut,
    FileText,
    File,
    Video,
    Music,
    Archive,
    Loader2
} from 'lucide-react';

interface FilePreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        id: string;
        name: string;
        type: 'image' | 'document' | 'audio' | 'video' | 'archive' | 'other';
        url: string;
        thumbnailUrl?: string;
        mimeType?: string;
    };
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
    isOpen,
    onClose,
    file
}) => {
    const t = useTranslations('chat');
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);
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
            setIsDownloading(false);
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 300));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 25));
    };

    const getFileIcon = () => {
        switch (file.type) {
            case 'document':
                return <FileText className="w-16 h-16 text-blue-500" />;
            case 'video':
                return <Video className="w-16 h-16 text-purple-500" />;
            case 'audio':
                return <Music className="w-16 h-16 text-green-500" />;
            case 'archive':
                return <Archive className="w-16 h-16 text-orange-500" />;
            default:
                return <File className="w-16 h-16 text-gray-500" />;
        }
    };

    const renderPreview = () => {
        switch (file.type) {
            case 'image':
                return (
                    <div className="flex items-center justify-center min-h-[400px] overflow-auto">
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain transition-transform"
                            style={{
                                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                transformOrigin: 'center'
                            }}
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <video
                            src={file.url}
                            controls
                            className="max-w-full max-h-full"
                            style={{ maxHeight: '400px' }}
                        >
                            Trình duyệt không hỗ trợ video này.
                        </video>
                    </div>
                );

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                        <Music className="w-24 h-24 text-green-500" />
                        <audio
                            src={file.url}
                            controls
                            className="w-full max-w-md"
                        >
                            Trình duyệt không hỗ trợ audio này.
                        </audio>
                    </div>
                );

            case 'document':
                if (file.mimeType === 'application/pdf') {
                    return (
                        <div className="min-h-[400px]">
                            <iframe
                                src={file.url}
                                className="w-full h-[500px] border border-gray-200 rounded"
                                title={file.name}
                            />
                        </div>
                    );
                }
            // Fall through to default case for other documents

            default:
                return (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                        {getFileIcon()}
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{file.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Không thể xem trước file này. Bạn có thể tải xuống để mở.
                            </p>
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2"
                            >
                                {isDownloading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {isDownloading ? t('uploading') : t('download')}
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-lg font-semibold truncate">
                                {file.name}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {file.type.toUpperCase()}
                                </Badge>
                                {file.mimeType && (
                                    <span className="text-xs text-gray-400">
                                        {file.mimeType}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Controls for images */}
                        {file.type === 'image' && (
                            <div className="flex items-center gap-1 ml-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 25}
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <span className="text-xs px-2 text-gray-500">
                                    {zoom}%
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 300}
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center gap-2 ml-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2"
                            >
                                {isDownloading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {isDownloading ? t('uploading') : t('download')}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="overflow-auto max-h-[calc(90vh-120px)]">
                    {renderPreview()}
                </div>

                {/* Keyboard shortcuts info */}
                {file.type === 'image' && (
                    <div className="text-xs text-gray-500 text-center mt-2">
                        Phím tắt: + (phóng to), - (thu nhỏ), R (xoay), ESC (đóng)
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FilePreviewDialog;