export interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  captcha?: string;
}

export interface ValidatorResponse {
  isValid: boolean;
  error?: string;
}