import { ValidatorResponse } from '../types';

/**
 * Validates an email address using Regex.
 * Pattern breakdown:
 * ^[^\s@]+       : Start with non-whitespace/non-@ chars
 * @              : Must contain an @ symbol
 * [^\s@]+        : Domain name (non-whitespace/non-@)
 * \.             : Must contain a dot
 * [^\s@]+$       : TLD (non-whitespace/non-@) at the end
 */
export const validateEmail = (email: string): ValidatorResponse => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, error: 'Email is required' };
  if (!emailRegex.test(email)) return { isValid: false, error: 'Please enter a valid email address' };
  return { isValid: true };
};

/**
 * Validates a phone number using Regex.
 * Allows for formats like:
 * (123) 456-7890
 * 123-456-7890
 * 123.456.7890
 * +11234567890
 */
export const validatePhone = (phone: string): ValidatorResponse => {
  const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;
  
  if (!phone) return { isValid: false, error: 'Phone number is required' };
  // Remove spaces, dashes, parens for length check if you wanted to be strict about digits,
  // but here we validate the format directly.
  if (!phoneRegex.test(phone)) return { isValid: false, error: 'Please enter a valid phone number' };
  return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidatorResponse => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
};