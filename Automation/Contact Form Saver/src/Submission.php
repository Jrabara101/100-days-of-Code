<?php

class Submission
{
    public string $id;
    public string $name;
    public string $email;
    public string $subject;
    public string $message;
    public ?string $phone;
    public string $createdAt;
    public string $updatedAt;

    public function __construct(
        string $name,
        string $email,
        string $subject,
        string $message,
        ?string $phone = null,
        ?string $id = null,
        ?string $createdAt = null,
        ?string $updatedAt = null
    ) {
        $this->name = trim($name);
        $this->email = trim($email);
        $this->subject = trim($subject);
        $this->message = trim($message);
        $this->phone = $phone ? trim($phone) : null;
        $this->id = $id ?? uniqid('sub_');
        $this->createdAt = $createdAt ?? date('Y-m-d H:i:s');
        $this->updatedAt = $updatedAt ?? date('Y-m-d H:i:s');
    }

    /**
     * Factory method to create a Submission instance from an associative array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['name'] ?? '',
            $data['email'] ?? '',
            $data['subject'] ?? '',
            $data['message'] ?? '',
            $data['phone'] ?? null,
            $data['id'] ?? null,
            $data['created_at'] ?? null,
            $data['updated_at'] ?? null
        );
    }

    /**
     * Converts the instance to an associative array for storage
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'subject' => $this->subject,
            'message' => $this->message,
            'phone' => $this->phone,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    /**
     * Validates fields before saving.
     * Returns an array of error messages, or empty array if valid.
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->name)) {
            $errors[] = "Name is required.";
        }

        if (empty($this->email)) {
            $errors[] = "Email is required.";
        } elseif (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Email must be a valid format.";
        }

        if (empty($this->subject)) {
            $errors[] = "Subject is required.";
        }

        if (empty($this->message)) {
            $errors[] = "Message is required.";
        }

        if (!empty($this->phone)) {
            // Optional basic phone validation (e.g., checks if it contains digits)
            if (!preg_match("/^[0-9\-\+\s\(\)]+$/", $this->phone)) {
                $errors[] = "Phone contains invalid characters (allowed: numbers, spaces, +, -, ()).";
            }
        }

        return $errors;
    }

    /**
     * Update fields dynamically
     */
    public function update(array $newData): void
    {
        if (isset($newData['name'])) $this->name = trim($newData['name']);
        if (isset($newData['email'])) $this->email = trim($newData['email']);
        if (isset($newData['subject'])) $this->subject = trim($newData['subject']);
        if (isset($newData['message'])) $this->message = trim($newData['message']);
        if (isset($newData['phone'])) $this->phone = trim($newData['phone']);
        
        $this->updatedAt = date('Y-m-d H:i:s');
    }
}
