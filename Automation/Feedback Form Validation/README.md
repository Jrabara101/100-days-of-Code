# Feedback Form Validation - PHP CLI

A terminal-based feedback form application built in pure PHP. It allows users to submit feedback interactively, validates all inputs strictly, and saves responses to a local JSON file.

## Features
- **Clean Architecture:** Code is organized into multiple files (`main.php`, `app/UIController.php`, `app/Validator.php`, `app/FeedbackManager.php`).
- **Interactive UI:** Uses ANSI escape codes for colored text and formatted terminal boxes/styles.
- **Robust Validation:** Fields are thoroughly validated. Users are re-prompted until valid input is given.
- **Review System:** Users see a summary of their feedback and must confirm before saving.
- **Local Storage:** Feedback records are stored as readable JSON in the `data/feedback.json` file.

## Folder Structure

```text
Feedback Form Validation/
│
├── app/
│   ├── FeedbackManager.php   // Handles JSON saving and retrieving
│   ├── UIController.php      // Handles terminal UI coloring, layout, and prompting
│   └── Validator.php         // Contains reusable validation functions
│
├── data/
│   └── feedback.json         // Stores feedback data (auto-generated)
│
├── main.php                  // Main entry point
└── README.md                 // Project documentation
```

## How It Works
1. **Entry Point (`main.php`):** Initializes the `UIController` and `FeedbackManager`. It displays the welcome screen and listens for user choices via a loop.
2. **Validation (`Validator.php`):** Contains static methods to check the format of emails, ensure names are >3 chars, messages are >10 chars, etc.
3. **UI rendering (`UIController.php`):** Wraps terminal input and output. The `promptAndValidate` acts as the engine for looping over a user prompt until the `Validator` gives a green light.
4. **Storage (`FeedbackManager.php`):** Appends the confirmed feedback array into `data/feedback.json`, generating a unique ID and timestamp for each entry.

## Sample CLI Output Preview

```text
=================================================
   WELCOME TO THE FEEDBACK FORM TERMINAL APP   
=================================================
Your feedback helps us improve our services.

--- MAIN MENU ---
1. Submit new feedback
2. View saved feedback
3. Exit
-----------------
Please enter your choice (1-3): 1

=== SUBMIT FEEDBACK ===
Please provide your feedback. Fields marked with '*' are required.

Full Name *: Jo
[ERROR] Full name must be at least 3 characters long.
Full Name *: John Doe
Email Address *: invalid-email
[ERROR] Please enter a valid email address.
Email Address *: john@example.com
Phone Number (Optional, press Enter to skip): 555-1234
Rating (1 to 5) *: 5

Feedback Categories:
1. Bug Report
2. Feature Request
3. General Feedback
4. Complaint
5. Support
Select a category (1-5) *: 3
Feedback Message (min 10 chars) *: This app works perfectly!

=== REVIEW YOUR FEEDBACK ===
-------------------------------------------------
Full Name      : John Doe
Email          : john@example.com
Rating         : 5/5
Category       : General Feedback
Phone          : 555-1234
-------------------------------------------------
Message        : This app works perfectly!
-------------------------------------------------
Do you want to save this feedback? (Y/N/Edit): y

[SUCCESS] Thank you! Your feedback has been saved.
```

## Suggestions for Future Improvements
- **Data Export:** Add a feature to export the JSON data to CSV format.
- **Search & Filter:** When viewing saved feedback, allow the user to search by `email` or filter by `rating` / `category`.
- **Database Storage:** Replace the JSON file storage with an SQLite or MySQL database integration for scalability.
- **Input Sanitization:** Add HTML-stripping (e.g. `strip_tags()`) on the inputs before saving if the JSON might be displayed on a web frontend later.
