"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AdminPageHeading,
  adminPrimaryButtonClass,
} from "@/components/admin/admin-list-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LucidePlus, Edit, Trash2, Eye, Copy } from "lucide-react";
import {
  GetStudyReportCriterias,
  StudyReportCriteria,
  DeleteStudyReportCriteria,
  CreateStudyReportCriteria,
} from "@/lib/api/report-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import Loading from "@/app/loading";
import { useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortAlphabetGeneric } from "@/lib/utils";

export default function CriteriaReportPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("criteriaReport");
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();

  const [criterias, setCriterias] = useState<StudyReportCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [criteriaToCopy, setCriteriaToCopy] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Fetch subjects for display
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        if (response?.data?.subjects && Array.isArray(response.data.subjects)) {
          setSubjects(
            response.data.subjects.map((s: any) => ({
              id: String(s.id),
              name: s.name,
            }))
          );
        } else {
          setSubjects([]);
        }
      } catch (error) {
        toast({
          title: tCommon("error"),
          description: "Không thể tải danh sách môn học",
          variant: "destructive",
        });
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [toast, tCommon, t]);

  // Fetch criteria list
  const fetchCriterias = useCallback(
    async (keyword?: string, subjectId?: number | string) => {
      try {
        setLoading(true);
        const params: { keyword?: string; subject_id?: number | string } = {};
        if (keyword) {
          params.keyword = keyword;
        }
        if (subjectId && subjectId !== "all") {
          params.subject_id = subjectId;
        }
        const response = await GetStudyReportCriterias(params);
        if (response?.code === 200 && response?.data?.study_report_criterias) {
          const newCriterias = response.data.study_report_criterias;
          setCriterias(newCriterias);
          setTotalCount(parseInt(response.data.total_count, 10));
        } else {
          setCriterias([]);
          setTotalCount(0);
        }
      } catch (error: any) {
        toast({
          title: tCommon("error"),
          description: t("loadError"),
          variant: "destructive",
        });
        setCriterias([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [toast, tCommon, t]
  );

  // Fetch when debounced search or subject filter changes
  useEffect(() => {
    const subjectId =
      selectedSubjectId === "all" ? undefined : Number(selectedSubjectId);
    fetchCriterias(debouncedSearch || undefined, subjectId);
  }, [debouncedSearch, selectedSubjectId, fetchCriterias]);

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || subjectId;
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return "";
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) {
      return;
    }

    try {
      const success = await DeleteStudyReportCriteria(id);
      if (success) {
        toast({
          title: tCommon("success"),
          description: t("deleteSuccess"),
        });
        // Refresh the list
        const subjectId =
          selectedSubjectId === "all" ? undefined : Number(selectedSubjectId);
        fetchCriterias(debouncedSearch || undefined, subjectId);
      }
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: t("deleteError"),
        variant: "destructive",
      });
    }
  };

  const handleCopyClick = (id: string, name: string) => {
    setCriteriaToCopy({ id, name });
    setCopyDialogOpen(true);
  };

  const handleConfirmCopy = async () => {
    if (!criteriaToCopy) return;

    try {
      const response = await CreateStudyReportCriteria({
        copy_from_study_report_criteria_id: Number(criteriaToCopy.id),
      } as any);
      
      if (response?.code === 200) {
        toast({
          title: tCommon("success"),
          description: t("copySuccess"),
        });
        setCopyDialogOpen(false);
        setCriteriaToCopy(null);
        // Refresh the list
        const subjectId =
          selectedSubjectId === "all" ? undefined : Number(selectedSubjectId);
        fetchCriterias(debouncedSearch || undefined, subjectId);
      }
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: t("copyError"),
        variant: "destructive",
      });
    }
  };

  if (loading && criterias.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AdminPageHeading title={t("title")} description={t("description")} />

        {/* Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto flex-1">
                <Select
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                  disabled={loadingSubjects}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder={t("table.subject")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filterAllSubjects")}</SelectItem>
                    {sortAlphabetGeneric(subjects, (item) => item.name, true).map(
                      (subject) => (
                        <SelectItem key={subject.id} value={String(subject.id)}>
                          {subject.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button asChild className={adminPrimaryButtonClass}>
                <Link href={`/${locale}/admin/criteria-report/create`}>
                  <LucidePlus className="mr-2 h-4 w-4" />
                  {t("createNew")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-center">
                    {t("table.name")}
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    {t("table.subject")}
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    {t("table.createdAt")}
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && criterias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : criterias.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-gray-500"
                    >
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  criterias.map((criteria) => (
                    <TableRow key={criteria.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-center">
                        {criteria.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {getSubjectName(criteria.subject_id)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(criteria.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            title={t("viewDetail")}
                          >
                            <Link
                              href={`/${locale}/admin/criteria-report/${criteria.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            title={t("editButton")}
                          >
                            <Link
                              href={`/${locale}/admin/criteria-report/${criteria.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("copyButton")}
                            onClick={() =>
                              handleCopyClick(criteria.id, criteria.name)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleDelete(criteria.id, criteria.name)
                            }
                            title={t("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Copy Confirmation Dialog */}
        <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("copyConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {criteriaToCopy &&
                  t("copyConfirmMessage", { name: criteriaToCopy.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCopy}>
                {tCommon("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
