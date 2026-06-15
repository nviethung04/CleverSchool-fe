import { useQuery } from "@tanstack/react-query";
import { GetHomeworkList, HomeworkFilters } from "@/lib/api/homeworks";

type HomeworkQueryFilters = HomeworkFilters & {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export function useHomeworksQuery(filters: HomeworkQueryFilters) {
  const { enabled = true, ...listFilters } = filters;
  const page = listFilters.page || 1;
  const limit = listFilters.limit || 10;

  return useQuery({
    queryKey: ["homeworks", { ...listFilters, page, limit }],
    queryFn: () => GetHomeworkList({ ...listFilters, page, limit }),
    enabled,
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });
}
