"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { AssessmentForm } from "../components/assessment-form";
import { useToast } from "@/components/ui/use-toast";
import { CreateAssessment, type FileInfo } from "@/lib/api/assessment";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { useTypedTranslations } from "@/lib/i18n/client";
import { GetSubjectsList } from "@/lib/api/subjects";
import {
  GetGroupList,
  type AssessmentCriteriaGroup,
} from "@/lib/api/group-criteria";
import {
  GetStudyReportCriterias,
  type StudyReportCriteriaListParams,
} from "@/lib/api/report-criteria";

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

export default function CreateAssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTypedTranslations("manageAssignments");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentType, setAssessmentType] = useState("mini_test");
  const [subjectId, setSubjectId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudyReportId, setSelectedStudyReportId] = useState("");
  const [assessmentCriteriaIds, setAssessmentCriteriaIds] = useState<number[]>(
    []
  );
  const [fileInfos, setFileInfos] = useState<UploadedFileMeta[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reference data state
  const [subjects, setSubjects] = useState<BasicOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [criteriaGroups, setCriteriaGroups] = useState<
    AssessmentCriteriaGroup[]
  >([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [studyReports, setStudyReports] = useState<BasicOption[]>([]);
  const [studyReportsLoading, setStudyReportsLoading] = useState(false);

  const [isNavigating, setIsNavigating] = useState(false);

  const normalizeFileInfos = useCallback((infos: UploadedFileMeta[]) => {
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
        } as FileInfo;
      })
      .filter((info): info is FileInfo => !!info);
  }, []);

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
    if (!subjectId) {
      setCriteriaGroups([]);
      setSelectedGroupId("");
      setStudyReports([]);
      setSelectedStudyReportId("");
      setAssessmentCriteriaIds([]);
      return;
    }

    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const { groups } = await GetGroupList(Number(subjectId));
        setCriteriaGroups(groups || []);
      } catch (error: any) {
        console.error("Error fetching criteria groups:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải bảng tiêu chí đánh giá",
          variant: "destructive",
        });
        setCriteriaGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    const loadStudyReports = async () => {
      try {
        setStudyReportsLoading(true);
        const params: StudyReportCriteriaListParams = {
          subject_id: Number(subjectId),
        };
        const response = await GetStudyReportCriterias(params);
        const list = response?.data?.study_report_criterias || [];
        const mapped =
          list?.map((item: any) => ({
            id: String(item.id),
            name: item.name,
          })) || [];
        setStudyReports(mapped);
      } catch (error: any) {
        console.error("Error fetching study report criterias:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải form báo cáo đánh giá",
          variant: "destructive",
        });
        setStudyReports([]);
      } finally {
        setStudyReportsLoading(false);
      }
    };

    loadGroups();
    loadStudyReports();
  }, [subjectId, toast]);

  useEffect(() => {
    if (!selectedGroupId) {
      setAssessmentCriteriaIds([]);
      return;
    }
    const selectedGroup = criteriaGroups.find(
      (group) => String(group.id) === selectedGroupId
    );
    if (selectedGroup?.criteria?.length) {
      const ids = selectedGroup.criteria
        .map((criteria) => Number(criteria.id))
        .filter((id) => !Number.isNaN(id));
      setAssessmentCriteriaIds(ids);
    } else {
      setAssessmentCriteriaIds([]);
    }
  }, [selectedGroupId, criteriaGroups]);

  const handleSave = async () => {
    if (isSaving) return; // ✅ stop spam

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

    if (!selectedStudyReportId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn form báo cáo đánh giá",
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
        program_id: 0,
        subject_id: Number(subjectId),
        assessment_criteria_group_id: selectedGroupId
          ? Number(selectedGroupId)
          : undefined,
        study_report_criteria_id: Number(selectedStudyReportId),
        assessment_criteria_ids: assessmentCriteriaIds,
        file_infos: normalizedFileInfos.length
          ? normalizedFileInfos
          : undefined,
        files: files.length ? files : undefined,
      };

      await CreateAssessment(assessmentData);

      toast({
        title: "Thành công",
        description: "Bài tập về nhà đã được tạo thành công.",
      });

      setTimeout(() => {
        setIsNavigating(true);
        router.push(getAssignmentsRoute(user));
      }, 500);
    } catch (error: any) {
      console.error("Error creating assessment:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo bài tập về nhà. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AssessmentForm
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      handleSave={handleSave}
      isSaving={isSaving}
      mode="create"
      backUrl={getAssignmentsRoute(user)}
      assessmentType={assessmentType}
      setAssessmentType={setAssessmentType}
      subjects={subjects}
      subjectsLoading={subjectsLoading}
      subjectId={subjectId}
      setSubjectId={setSubjectId}
      criteriaGroups={criteriaGroups}
      groupsLoading={groupsLoading}
      selectedGroupId={selectedGroupId}
      setSelectedGroupId={setSelectedGroupId}
      studyReports={studyReports}
      studyReportsLoading={studyReportsLoading}
      selectedStudyReportId={selectedStudyReportId}
      setSelectedStudyReportId={setSelectedStudyReportId}
      onFilesChange={handleFilesChange}
    />
  );
}
