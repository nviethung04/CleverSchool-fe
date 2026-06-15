import { useQuery } from "@tanstack/react-query";
import { GetAssessmentList, AssessmentFilters } from "@/lib/api/assessment";

type AssessmentQueryFilters = AssessmentFilters & {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export function useAssessmentQuery(filters: AssessmentQueryFilters) {
  const { enabled = true, ...listFilters } = filters;
  const page = listFilters.page || 1;
  const limit = listFilters.limit || 10;

  return useQuery({
    queryKey: ["assessment", { ...listFilters, page, limit }],
    queryFn: () => GetAssessmentList({ ...listFilters, page, limit }),
    enabled,
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}
