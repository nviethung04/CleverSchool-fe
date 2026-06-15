"use client";

import { useEffect, useState } from "react";
import { GetSubjectsList } from "@/lib/api/subjects";
import {
  getQuestionAttributes,
  type QuestionAttributeNode,
} from "@/lib/api/questions";
import { sortAlphabetGeneric } from "@/lib/utils";

export function useQuestionMetadata() {
  const [subjectOptions, setSubjectOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [attributes, setAttributes] = useState<QuestionAttributeNode[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedCognitionId, setSelectedCognitionId] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await GetSubjectsList();
        const subjects = res?.data?.subjects || [];
        const options = subjects.map((s: { id: string | number; name: string }) => ({
          value: String(s.id),
          label: s.name,
        }));
        if (!isMounted) return;
        setSubjectOptions(
          sortAlphabetGeneric(options, (item) => item.label, true)
        );
      } catch {
        if (isMounted) setSubjectOptions([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (subjectOptions.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectOptions[0].value);
    }
  }, [subjectOptions, selectedSubjectId]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setAttributes([]);
      setSelectedSkillId("");
      setSelectedLevelId("");
      setSelectedCognitionId("");
      return;
    }

    let isMounted = true;
    setAttributesLoading(true);
    getQuestionAttributes(selectedSubjectId)
      .then((attrs) => {
        if (!isMounted) return;
        setAttributes(attrs);
        setSelectedSkillId("");
        setSelectedLevelId("");
        setSelectedCognitionId("");
      })
      .finally(() => {
        if (isMounted) setAttributesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSubjectId]);

  const skillAttr = attributes[0];
  const levelAttr = attributes[1];
  const cognitionAttr = attributes[2];

  const toNodeOptions = (nodes: QuestionAttributeNode[] = []) =>
    nodes.map((node) => ({
      value: String(node.id),
      label: node.name,
    }));

  return {
    subjectOptions,
    selectedSubjectId,
    setSelectedSubjectId,
    attributes,
    attributesLoading,
    skillAttr,
    levelAttr,
    cognitionAttr,
    selectedSkillId,
    setSelectedSkillId,
    selectedLevelId,
    setSelectedLevelId,
    selectedCognitionId,
    setSelectedCognitionId,
    toNodeOptions,
  };
}

type MetadataToast = (options: {
  title: string;
  description: string;
  variant?: "destructive" | "default";
}) => void;

type MetadataTranslator = (key: string) => string;

export function validateQuestionMetadata(
  meta: ReturnType<typeof useQuestionMetadata>,
  toast: MetadataToast,
  t: MetadataTranslator
): boolean {
  if (!meta.selectedSubjectId) {
    toast({
      title: "Lỗi",
      description: t("validation.subjectRequired"),
      variant: "destructive",
    });
    return false;
  }

  if (meta.attributesLoading) {
    toast({
      title: "Lỗi",
      description: t("loadingAttributes"),
      variant: "destructive",
    });
    return false;
  }

  if (meta.attributes.length === 0) {
    toast({
      title: "Lỗi",
      description: t("attributesNotLoaded"),
      variant: "destructive",
    });
    return false;
  }

  if (meta.skillAttr?.nodes?.length && !meta.selectedSkillId) {
    toast({
      title: "Lỗi",
      description: t("validation.skillRequired"),
      variant: "destructive",
    });
    return false;
  }

  if (meta.levelAttr?.nodes?.length && !meta.selectedLevelId) {
    toast({
      title: "Lỗi",
      description: t("validation.levelRequired"),
      variant: "destructive",
    });
    return false;
  }

  if (meta.cognitionAttr?.nodes?.length && !meta.selectedCognitionId) {
    toast({
      title: "Lỗi",
      description: t("validation.cognitionRequired"),
      variant: "destructive",
    });
    return false;
  }

  return true;
}
