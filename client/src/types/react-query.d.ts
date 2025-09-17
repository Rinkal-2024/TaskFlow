declare module '@tanstack/react-query' {
  export interface QueryClient {
    setQueryData: (key: any, data: any) => void;
    invalidateQueries: (options: any) => void;
    clear: () => void;
  }
  
  export interface QueryClientProviderProps {
    client: QueryClient;
    children: React.ReactNode;
  }
  
  export class QueryClient {
    constructor(options?: any);
    setQueryData: (key: any, data: any) => void;
    invalidateQueries: (options: any) => void;
    clear: () => void;
  }
  
  export function QueryClientProvider(props: QueryClientProviderProps): JSX.Element;
  export function useQuery(options: any): any;
  export function useMutation(options: any): any;
  export function useQueryClient(): QueryClient;
} 