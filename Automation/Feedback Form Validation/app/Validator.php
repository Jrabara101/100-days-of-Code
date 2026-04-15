<?php

class Validator {
    
    /**
     * Validate full name (required, min 3 chars)
     */
    public static function validateName($name) {
        $name = trim($name);
        if (empty($name)) {
            return "Full name is required.";
        }
        if (strlen($name) < 3) {
            return "Full name must be at least 3 characters long.";
        }
        return true;
    }

    /**
     * Validate email (required, valid format)
     */
    public static function validateEmail($email) {
        $email = trim($email);
        if (empty($email)) {
            return "Email is required.";
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "Please enter a valid email address.";
        }
        return true;
    }

    /**
     * Validate rating (required, 1-5)
     */
    public static function validateRating($rating) {
        $rating = trim($rating);
        if (empty($rating)) {
            return "Rating is required.";
        }
        if (!is_numeric($rating) || (int)$rating != $rating || $rating < 1 || $rating > 5) {
            return "Rating must be an integer between 1 and 5.";
        }
        return true;
    }

    /**
     * Validate category (required, 1-5)
     */
    public static function validateCategory($category) {
        $category = trim($category);
        if (empty($category)) {
            return "Category is required.";
        }
        if (!in_array($category, ['1', '2', '3', '4', '5'])) {
            return "Please select a valid category option (1-5).";
        }
        return true;
    }

    /**
     * Validate message (required, min 10 chars)
     */
    public static function validateMessage($message) {
        $message = trim($message);
        if (empty($message)) {
            return "Message is required.";
        }
        if (strlen($message) < 10) {
            return "Message must be at least 10 characters long.";
        }
        return true;
    }

    /**
     * Validate phone number (optional, basic validation)
     */
    public static function validatePhone($phone) {
        $phone = trim($phone);
        // Phone is optional
        if (empty($phone)) {
            return true;
        }
        // Basic phone validation: allows numbers, +, -, and spaces, generally at least 7 chars long
        if (!preg_match("/^[+0-9\s-]{7,20}$/", $phone)) {
            return "Phone number format is invalid.";
        }
        return true;
    }
}
