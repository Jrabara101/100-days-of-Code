import React, { useState } from 'react';
import Input from './Input';
import Captcha from './Captcha';
import { FormData, FormErrors } from '../types';
import { validateEmail, validatePhone, validateRequired } from '../utils/validation';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    name: false,
    email: false,
    phone: false,
    message: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'name':
        return validateRequired(value, 'Name').error;
      case 'email':
        return validateEmail(value).error;
      case 'phone':
        return validatePhone(value).error;
      case 'message':
        return validateRequired(value, 'Message').error;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error immediately if valid to improve UX
    const error = validateField(name as keyof FormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof FormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    if (!captchaVerified) {
      newErrors.captcha = "Please verify that you are not a robot";
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      message: true
    });

    if (isValid) {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTouched({ name: false, email: false, phone: false, message: false });
      setCaptchaVerified(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-xl border border-border animate-fade-in text-center h-[500px]">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
        <p className="text-gray-400 mb-6">Thanks for reaching out. We'll be in touch shortly.</p>
        <button 
          onClick={() => setSubmitSuccess(false)}
          className="px-6 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 w-full max-w-lg mx-auto">
      <Input
        label="What's your name?"
        name="name"
        value={formData.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
        placeholder="Jane Doe"
      />

      <Input
        label="What's your email address?"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
        placeholder="jane@example.com"
      />

      <Input
        label="What's your phone number?"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.phone}
        touched={touched.phone}
        placeholder="(555) 123-4567"
      />

      <Input
        label="Message"
        name="message"
        value={formData.message}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.message}
        touched={touched.message}
        isTextArea
        placeholder="Objectively describe your message to our team."
      />

      <div className="mt-2">
        <Captcha 
          onVerify={(val) => {
            setCaptchaVerified(val);
            setErrors(prev => ({ ...prev, captcha: undefined }));
          }} 
          error={errors.captcha}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primaryHover text-white font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : (
          'Contact us'
        )}
      </button>
    </form>
  );
};

export default ContactForm;