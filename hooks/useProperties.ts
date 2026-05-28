import { useQuery } from '@tanstack/react-query';

import { fetchProperties } from '@/data/services/propertyService';

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
    staleTime: 60_000,
  });
}
