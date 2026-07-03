export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T; // chỉ có khi success = true
}
