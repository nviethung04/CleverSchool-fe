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
import {
  AdminCreateButton,
  AdminListToolbar,
  AdminPageHeading,
} from "@/components/admin/admin-list-header";
import {
  GetSemestersList,
  DeleteSemester,
  Semester,
} from "@/lib/api/semesters";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import { useTranslations } from "next-intl";

export default function SemestersPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("manageSemester");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await GetSemestersList();
      if (response?.data?.semesters) {
        setSemesters(response.data.semesters);
      } else {
        setSemesters([]);
      }
    } catch (error: any) {
      console.error("Error fetching semesters:", error);
      toast({
        title: tCommon("error"),
        description: t("loadError"),
        variant: "destructive",
      });
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) {
      return;
    }

    try {
      await DeleteSemester(id);
      toast({
        title: tCommon("success"),
        description: t("deleteSuccess"),
      });
      fetchSemesters();
    } catch (error: any) {
      console.error("Error deleting semester:", error);
      toast({
        title: tCommon("error"),
        description: error?.response?.data?.message || t("deleteError"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/${locale}/admin/semesters/${id}/edit`);
  };

  const handleCreate = () => {
    router.push(`/${locale}/admin/semesters/create`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "0001-01-01") {
      return "-";
    }
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
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
                  <span className="font-semibold">{semesters.length}</span>
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
                    <TableHead className="text-center">
                      {t("table.startDate")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("table.endDate")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("table.holidaysCount")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("table.status")}
                    </TableHead>
                    <TableHead className="text-center w-32">
                      {t("table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semesters.length > 0 ? (
                    semesters.map((semester, index) => (
                      <TableRow key={semester.id}>
                        <TableCell className="text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {semester.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDate(semester.start_date)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatDate(semester.end_date)}
                        </TableCell>
                        <TableCell className="text-center">
                          {semester.holidays?.length || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              semester.status ? "default" : "destructive"
                            }
                          >
                            {semester.status
                              ? t("status.active")
                              : t("status.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(semester.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                handleDelete(semester.id, semester.name)
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
