"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { AssessmentForm } from "../../components/assessment-form";
import { useToast } from "@/components/ui/use-toast";
import {
  GetAssessmentDetail,
  UpdateAssessment,
  type FileInfo,
} from "@/lib/api/assessment";
import { GetSubjectsList } from "@/lib/api/subjects";
import Loading from "@/app/loading";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";

type BasicOption = {
  id: string;
  name: string;
};

type UploadedFileMeta = {
  id?: number;
  disk?: string;
  disk_name?: string;
  path?: string;
  url?: string;
  [key: string]: any;
};

type UploadedFileDisplay = {
  type: string;
  url: string;
  name?: string;
  backendInfo?: Record<string, any>;
};

const inferFileType = (url?: string): string => {
  if (!url) return "file";
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "doc";
  if (
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"].some((ext) =>
      lower.endsWith(ext)
    )
  ) {
    return "image";
  }
  return "file";
};

const buildInitialUploadedFiles = (
  fileInfos?: FileInfo[],
  files?: string[]
): UploadedFileDisplay[] => {
  if (!fileInfos?.length && !files?.length) {
    return [];
  }

  const results: UploadedFileDisplay[] = [];
  const safeFiles = files || [];

  if (fileInfos?.length) {
    fileInfos.forEach((info, index) => {
      const urlCandidate =
        safeFiles[index] ||
        safeFiles.find((candidate) =>
          info.path ? candidate?.includes(info.path) : false
        ) ||
        info.path ||
        "";

      if (!urlCandidate) {
        return;
      }

      results.push({
        type: inferFileType(urlCandidate),
        url: urlCandidate,
        name: urlCandidate.split("/").pop() || info.path?.split("/").pop(),
        backendInfo: {
          id: info.id,
          disk: info.disk,
          path: info.path,
        },
      });
    });
  } else if (safeFiles.length) {
    safeFiles.forEach((url, index) => {
      results.push({
        type: inferFileType(url),
        url,
        name: url.split("/").pop(),
        backendInfo: {
          id: index + 1,
          disk: "public",
          path: url,
        },
      });
    });
  }

  return results;
};

const normalizeFileInfos = (infos: UploadedFileMeta[]): FileInfo[] => {
  return infos
    .map((info, index) => {
      const path = info?.path || info?.url;
      if (!path) {
        return null;
      }
      const disk = info?.disk || info?.disk_name || "public";
      return {
        id:
          typeof info?.id === "number" && !Number.isNaN(info.id)
            ? info.id
            : index + 1,
        disk,
        path,
      };
    })
    .filter((item): item is FileInfo => !!item);
};

export default function EditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const assessmentId = params?.id as string;
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentType, setAssessmentType] = useState("mini_test");
  const [subjectId, setSubjectId] = useState("");
  const [fileInfos, setFileInfos] = useState<UploadedFileMeta[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [initialUploadedFiles, setInitialUploadedFiles] = useState<
    UploadedFileDisplay[]
  >([]);
  const [programId, setProgramId] = useState<number>(0);

  const [subjects, setSubjects] = useState<BasicOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const handleFilesChange = useCallback(
    ({
      fileInfos: infos,
      files: urls,
    }: {
      fileInfos: UploadedFileMeta[];
      files: string[];
    }) => {
      setFileInfos(infos || []);
      setFiles(urls || []);
    },
    []
  );

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const response = await GetSubjectsList();
        const subjectList =
          response?.data?.subjects || response?.subjects || [];
        const mapped =
          subjectList?.map((subject: any) => ({
            id: String(subject.id),
            name: subject.name,
          })) || [];
        setSubjects(mapped);
      } catch (error: any) {
        console.error("Error fetching subjects:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách môn học",
          variant: "destructive",
        });
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [toast]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!assessmentId) return;
      setIsInitializing(true);
      try {
        const detail = await GetAssessmentDetail(assessmentId);
        setName(detail.name || "");
        setDescription(detail.description || "");
        setAssessmentType(detail.type || "mini_test");

        if (
          detail.program_id !== undefined &&
          detail.program_id !== null &&
          !Number.isNaN(Number(detail.program_id))
        ) {
          setProgramId(Number(detail.program_id));
        }

        const initialFiles = buildInitialUploadedFiles(
          detail.file_infos,
          detail.files
        );
        setInitialUploadedFiles(initialFiles);

        const resolvedSubjectId =
          detail.subject_id !== undefined && detail.subject_id !== null
            ? String(detail.subject_id)
            : "";

        setSubjectId(resolvedSubjectId);
      } catch (error: any) {
        console.error("Error fetching assessment detail:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải chi tiết bài đánh giá",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    fetchDetail();
  }, [assessmentId, toast]);

  const handleSave = async () => {
    if (isSaving) return;

    if (!name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên bài tập về nhà",
        variant: "destructive",
      });
      return;
    }

    if (!subjectId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn môn học",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const normalizedFileInfos = normalizeFileInfos(fileInfos);
      const assessmentData = {
        name: name.trim(),
        description: description.trim(),
        type: assessmentType,
        program_id: programId ?? 0,
        subject_id: Number(subjectId),
        file_infos: normalizedFileInfos.length
          ? normalizedFileInfos
          : undefined,
        files: files.length ? files : undefined,
      };

      await UpdateAssessment(assessmentId, assessmentData);

      toast({
        title: "Thành công",
        description: "Bài đánh giá đã được cập nhật.",
      });

      setTimeout(() => {
        setIsNavigating(true);
        router.push(getAssignmentsRoute(user));
      }, 500);
    } catch (error: any) {
      console.error("Error updating assessment:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật bài đánh giá. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing) {
    return <Loading />;
  }

  return (
    <AssessmentForm
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      handleSave={handleSave}
      isSaving={isSaving}
      mode="edit"
      assessmentId={assessmentId}
      backUrl={getAssignmentsRoute(user)}
      assessmentType={assessmentType}
      setAssessmentType={setAssessmentType}
      subjects={subjects}
      subjectsLoading={subjectsLoading}
      subjectId={subjectId}
      setSubjectId={setSubjectId}
      onFilesChange={handleFilesChange}
      initialUploadedFiles={initialUploadedFiles}
    />
  );
}
