export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Record<string, any> | any[] | null;
}
