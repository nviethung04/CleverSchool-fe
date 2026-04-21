"use client";

import React from "react";
import Link from "next/link";
import {
  getH5PList,
  type H5PContentSummary,
  deleteH5PContent,
} from "@/lib/api/h5p";
import { uploadFile } from "@/lib/api/questions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useParams } from "next/navigation";

export default function H5PListPage() {
  const [items, setItems] = React.useState<H5PContentSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const params = useParams();
  const locale = params?.locale || "vi";

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getH5PList()
      .then((data) => {
        if (!isMounted) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Failed to load H5P list");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshList = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getH5PList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load H5P list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadFile(file, "h5p");
      await refreshList();
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      // reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    setDeleteError(null);
    try {
      setIsDeleting(true);
      await deleteH5PContent(contentId);
      await refreshList();
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Xóa thất bại");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Nội dung H5P</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".zip,.rar,.h5p"
            onChange={handleFileChange}
          />
          <Button onClick={handleUploadClick} disabled={isUploading}>
            {isUploading ? "Đang tải lên..." : "Tải lên"}
          </Button>
        </div>
      </div>
      {uploadError && (
        <div className="text-red-600 text-sm mb-4">{uploadError}</div>
      )}
      {deleteError && (
        <div className="text-red-600 text-sm mb-4">{deleteError}</div>
      )}
      {items.length === 0 ? (
        <div>Không có nội dung H5P.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <Card key={item.contentId} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{item.mainLibrary}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground break-all">
                  ID: {item.contentId}
                </div>
              </CardContent>
              <CardFooter className="mt-auto w-full">
                <div className="flex w-full flex-col sm:flex-row gap-2">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/${locale}/admin/h5p/${item.contentId}/preview`}>
                      Xem nội dung
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteTargetId(item.contentId);
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa nội dung H5P và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
