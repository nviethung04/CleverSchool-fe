"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { GetSubjectsList, DeleteSubject } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import { useTranslations } from "next-intl";
import {
  AdminCreateButton,
  AdminListToolbar,
  AdminPageHeading,
} from "@/components/admin/admin-list-header";

interface Subject {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export default function SubjectsPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("manageSubject");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await GetSubjectsList();
      if (response?.data?.subjects) {
        setSubjects(response.data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      toast({
        title: tCommon("error"),
        description: t("loadError"),
        variant: "destructive",
      });
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) {
      return;
    }

    try {
      await DeleteSubject(id);
      toast({
        title: tCommon("success"),
        description: t("deleteSuccess"),
      });
      fetchSubjects();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast({
        title: tCommon("error"),
        description: error?.response?.data?.message || t("deleteError"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/${locale}/admin/subjects/${id}/edit`);
  };

  const handleCreate = () => {
    router.push(`/${locale}/admin/subjects/create`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AdminPageHeading title={t("title")} description={t("description")} />

        <Card>
          <CardHeader>
            <AdminListToolbar
              summary={
                <>
                  {t("totalCount")}:{" "}
                  <span className="font-semibold">{subjects.length}</span>
                </>
              }
              action={
                <AdminCreateButton onClick={handleCreate}>
                  {t("createNew")}
                </AdminCreateButton>
              }
            />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">
                      {t("table.no")}
                    </TableHead>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead className="text-center">
                      {t("table.status")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("table.createdAt")}
                    </TableHead>
                    <TableHead className="text-center w-32">
                      {t("table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.length > 0 ? (
                    subjects.map((subject, index) => (
                      <TableRow key={subject.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {subject.name}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {subject.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              subject.status ? "default" : "destructive"
                            }
                          >
                            {subject.status
                              ? t("status.active")
                              : t("status.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {subject.created_at
                            ? new Date(subject.created_at).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(subject.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                handleDelete(subject.id, subject.name)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        {t("noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
