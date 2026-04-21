import { useQuery } from "@tanstack/react-query";
import { GetAssessmentList, AssessmentFilters } from "@/lib/api/assessment";

// Update the AssessmentFilters type if needed in the API file
export function useAssessmentQuery(filters: AssessmentFilters & { page?: number, limit?: number }) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  
  return useQuery({
    queryKey: ["assessment", { ...filters, page, limit }],
    queryFn: () => GetAssessmentList({ ...filters, page, limit }),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}
