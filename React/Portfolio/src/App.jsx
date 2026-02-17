import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "genesis-project-creation-wizard";

const PROJECT_TYPES = [
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "engineering", label: "Engineering" },
];

const MARKETING_CHANNELS = [
  "Instagram",
  "LinkedIn",
  "YouTube",
  "X / Twitter",
  "Email",
  "TikTok",
];

const TAKEN_PROJECT_NAMES = new Set([
  "archetype",
  "northstar",
  "atlas launch",
  "pulse campaign",
]);

const INITIAL_FORM = {
  projectName: "",
  email: "",
  password: "",
  projectType: "",
  budget: "",
  dueDate: "",
  brief: "",
  channels: [],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const debounce = (func, waitMs) => {
  let timeout;
  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
};

const formatBudget = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return `$${Number(digits).toLocaleString("en-US")}`;
};

const cursorFromDigitCount = (formattedValue, digitsBeforeCursor) => {
  if (digitsBeforeCursor <= 0) {
    return formattedValue.startsWith("$") ? 1 : 0;
  }
  let digitsSeen = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      digitsSeen += 1;
      if (digitsSeen === digitsBeforeCursor) {
        return index + 1;
      }
    }
  }
  return formattedValue.length;
};

const getPasswordIssues = (value) => {
  const issues = [];
  if (value.length < 8) {
    issues.push("Use at least 8 characters.");
  }
  if (!/[A-Z]/.test(value)) {
    issues.push("Add one uppercase letter.");
  }
  if (!/[0-9]/.test(value)) {
    issues.push("Include at least one number.");
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;/`~]/.test(value)) {
    issues.push("Missing a symbol.");
  }
  return issues;
};

const normalizeForm = (form) => ({
  ...form,
  projectName: form.projectName.trim(),
  email: form.email.trim().toLowerCase(),
  budget: form.budget.replace(/\D/g, ""),
  brief: form.brief.trim(),
  channels: [...form.channels].sort(),
});

const loadStoredForm = () => {
  if (typeof window === "undefined") {
    return INITIAL_FORM;
  }

  try {
    const storedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) {
      return INITIAL_FORM;
    }

    const parsed = JSON.parse(storedRaw);
    const safeProjectType = PROJECT_TYPES.some(
      (option) => option.value === parsed.projectType,
    )
      ? parsed.projectType
      : "";
    const safeChannels = Array.isArray(parsed.channels)
      ? parsed.channels.filter((channel) => MARKETING_CHANNELS.includes(channel))
      : [];

    return {
      ...INITIAL_FORM,
      ...parsed,
      projectType: safeProjectType,
      channels: safeProjectType === "marketing" ? safeChannels : [],
      budget: formatBudget(parsed.budget),
    };
  } catch {
    return INITIAL_FORM;
  }
};

const checkProjectNameAvailability = async (projectName) => {
  await wait(700);
  return !TAKEN_PROJECT_NAMES.has(projectName.trim().toLowerCase());
};

function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  onFocusField,
  onBlurField,
  isValid,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const optionIndex = options.findIndex((option) => option.value === value);
    setHighlightedIndex(optionIndex >= 0 ? optionIndex : 0);
  }, [options, value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const selectByIndex = (nextIndex) => {
    const safeIndex =
      nextIndex < 0 ? options.length - 1 : nextIndex % options.length;
    const nextOption = options[safeIndex];
    if (nextOption) {
      onChange(nextOption.value);
      setHighlightedIndex(safeIndex);
    }
    setIsOpen(false);
  };

  const onKeyDown = (event) => {
    if (!options.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      setHighlightedIndex((index) => (index + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      setHighlightedIndex((index) =>
        index - 1 < 0 ? options.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) {
        selectByIndex(highlightedIndex);
      } else {
        setIsOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const onBlur = (event) => {
    if (!wrapperRef.current?.contains(event.relatedTarget)) {
      setIsOpen(false);
      onBlurField();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`select-shell ${value ? "has-value" : ""}`}
      onBlur={onBlur}
    >
      <button
        id={`${id}-button`}
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-invalid={Boolean(error)}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={onKeyDown}
        onFocus={onFocusField}
      >
        <span className={`select-value ${value ? "has-value" : ""}`}>
          {selectedOption?.label ?? "Choose one option"}
        </span>
      </button>
      <label
        className={`floating-label ${value || isOpen ? "floating" : ""} ${isValid ? "valid" : ""}`}
        htmlFor={`${id}-button`}
      >
        {label}
        {isValid ? <span className="label-check">✓</span> : null}
      </label>
      <ul
        id={`${id}-listbox`}
        className={`select-menu ${isOpen ? "open" : ""}`}
        role="listbox"
        aria-labelledby={`${id}-button`}
      >
        {options.map((option, optionIndex) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            className={`select-option ${
              highlightedIndex === optionIndex ? "highlighted" : ""
            } ${option.value === value ? "selected" : ""}`}
            onMouseEnter={() => setHighlightedIndex(optionIndex)}
          >
            <button type="button" onClick={() => selectByIndex(optionIndex)}>
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [initialForm] = useState(() => loadStoredForm());
  const [form, setForm] = useState(initialForm);
  const [activeField, setActiveField] = useState(null);
  const [touched, setTouched] = useState({});
  const [projectNameStatus, setProjectNameStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(true);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const budgetInputRef = useRef(null);
  const requestTokenRef = useRef(0);
  const initialSnapshotRef = useRef(JSON.stringify(normalizeForm(initialForm)));

  const passwordIssues = useMemo(
    () => getPasswordIssues(form.password),
    [form.password],
  );

  const validateProjectName = useMemo(
    () =>
      debounce(async (projectName, requestToken) => {
        const isAvailable = await checkProjectNameAvailability(projectName);
        if (requestToken !== requestTokenRef.current) {
          return;
        }
        setProjectNameStatus(isAvailable ? "available" : "taken");
      }, 500),
    [],
  );

  useEffect(
    () => () => {
      validateProjectName.cancel();
    },
    [validateProjectName],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setLastSavedAt(new Date());
    } catch {
      // Ignore storage failures in private browsing contexts.
    }
  }, [form]);

  const isDirty = useMemo(() => {
    const currentSnapshot = JSON.stringify(normalizeForm(form));
    return currentSnapshot !== initialSnapshotRef.current;
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const validationErrors = useMemo(() => {
    const errors = {};
    if (form.projectName.trim().length < 3) {
      errors.projectName = "Project name needs at least 3 characters.";
    } else if (projectNameStatus === "taken") {
      errors.projectName = "This project name already exists.";
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = "Use a valid email format.";
    }
    if (passwordIssues.length > 0) {
      errors.password = "Strengthen your password.";
    }
    if (!form.projectType) {
      errors.projectType = "Select a project type.";
    }
    if (!form.budget) {
      errors.budget = "Set a budget to continue.";
    }
    if (!form.dueDate) {
      errors.dueDate = "Choose a target completion date.";
    }
    if (form.brief.trim().length < 20) {
      errors.brief = "Brief should be at least 20 characters long.";
    }
    if (form.projectType === "marketing" && form.channels.length === 0) {
      errors.channels = "Choose at least one social channel.";
    }
    return errors;
  }, [form, passwordIssues.length, projectNameStatus]);

  const projectNameStatusText = {
    checking: "Checking...",
    available: "Available",
    taken: "Taken",
  }[projectNameStatus];

  const isProjectNameValid =
    form.projectName.trim().length >= 3 && projectNameStatus === "available";
  const isEmailValid = EMAIL_PATTERN.test(form.email.trim());
  const isProjectTypeValid = Boolean(form.projectType);
  const isBudgetValid = Boolean(form.budget);
  const isDueDateValid = Boolean(form.dueDate);
  const isBriefValid = form.brief.trim().length >= 20;
  const isSubmitDisabled = isSubmitting || projectNameStatus === "checking";
  const savedAtText = lastSavedAt
    ? `Saved locally at ${lastSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`
    : "Local persistence ready";

  const fieldClass = (fieldKey, extraClass = "") =>
    [
      "field-card",
      activeField && activeField !== fieldKey ? "dimmed" : "",
      activeField === fieldKey ? "active" : "",
      extraClass,
    ]
      .join(" ")
      .trim();

  const showError = (fieldKey) => Boolean(touched[fieldKey] && validationErrors[fieldKey]);

  const onFieldFocus = useCallback((fieldKey) => {
    setActiveField(fieldKey);
  }, []);

  const onFieldBlur = useCallback((fieldKey) => {
    setTouched((current) => ({ ...current, [fieldKey]: true }));
    setActiveField((current) => (current === fieldKey ? null : current));
  }, []);

  const setFieldValue = (fieldKey, value) => {
    setForm((current) => ({ ...current, [fieldKey]: value }));
    setSubmitMessage("");
  };

  const onProjectNameChange = (event) => {
    const nextValue = event.target.value;
    setFieldValue("projectName", nextValue);

    if (nextValue.trim().length < 3) {
      requestTokenRef.current += 1;
      validateProjectName.cancel();
      setProjectNameStatus("idle");
      return;
    }

    setProjectNameStatus("checking");
    requestTokenRef.current += 1;
    const token = requestTokenRef.current;
    validateProjectName(nextValue.trim(), token);
  };

  const onProjectTypeChange = (nextValue) => {
    setForm((current) => ({
      ...current,
      projectType: nextValue,
      channels: nextValue === "marketing" ? current.channels : [],
    }));
    setSubmitMessage("");
  };

  const onBudgetChange = (event) => {
    const rawValue = event.target.value;
    const inputCursor = event.target.selectionStart ?? rawValue.length;
    const digitsBeforeCursor = rawValue
      .slice(0, inputCursor)
      .replace(/\D/g, "").length;
    const formattedValue = formatBudget(rawValue);
    setFieldValue("budget", formattedValue);

    requestAnimationFrame(() => {
      const input = budgetInputRef.current;
      if (!input) {
        return;
      }
      const nextCursor = cursorFromDigitCount(formattedValue, digitsBeforeCursor);
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const onChannelToggle = (channel) => {
    setForm((current) => {
      const exists = current.channels.includes(channel);
      return {
        ...current,
        channels: exists
          ? current.channels.filter((entry) => entry !== channel)
          : [...current.channels, channel],
      };
    });
    setTouched((current) => ({ ...current, channels: true }));
    setSubmitMessage("");
  };

  const onChannelBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onFieldBlur("channels");
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      projectName: true,
      email: true,
      password: true,
      projectType: true,
      budget: true,
      dueDate: true,
      brief: true,
      channels: true,
    });

    if (Object.keys(validationErrors).length > 0 || projectNameStatus === "checking") {
      return;
    }

    setIsSubmitting(true);
    await wait(1800);
    setIsSubmitting(false);

    const projectName = form.projectName.trim() || "Untitled project";
    setSubmitMessage(`Project "${projectName}" created successfully.`);
    initialSnapshotRef.current = JSON.stringify(normalizeForm(form));
  };

  const onAttemptCloseWizard = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
      return;
    }
    setWizardOpen(false);
  };

  const onDiscardChanges = () => {
    setShowDiscardDialog(false);
    setWizardOpen(false);
    setForm(initialForm);
    setTouched({});
    setProjectNameStatus("idle");
    setActiveField(null);
    setSubmitMessage("");
  };

  return (
    <main className="page">
      <header className="hero">
        <nav className="top-nav">
          <div className="brand-mark" aria-label="Studio Genesis">
            <span className="brand-icon" aria-hidden="true" />
            <span>Studio</span>
          </div>
          <ul className="nav-list">
            <li>Works</li>
            <li>Philosophy</li>
            <li>Contact</li>
          </ul>
        </nav>

        <p className="hero-kicker">Volume Zero - Edition 2026</p>
        <h1 className="hero-title">Archetype #11</h1>
        <p className="hero-subtext">
          Narrative-driven digital craft where polished interfaces meet reliable
          interaction engineering.
        </p>
      </header>

      <section className="wizard-shell" aria-labelledby="wizard-title">
        <div className="wizard-header">
          <div>
            <p className="section-label">Genesis</p>
            <h2 id="wizard-title">The Intelligent Project Creation Wizard</h2>
            <p className="wizard-summary">
              Dynamic field injection, async validation, focus mode, and resilient
              recovery for high-stakes data entry.
            </p>
          </div>
          {wizardOpen ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={onAttemptCloseWizard}
            >
              Close Wizard
            </button>
          ) : null}
        </div>

        {!wizardOpen ? (
          <div className="wizard-closed">
            <p>Wizard is closed. Reopen to continue creating your project.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setWizardOpen(true)}
            >
              Reopen Wizard
            </button>
          </div>
        ) : (
          <form
            className={`wizard-form ${activeField ? "focus-mode" : ""}`}
            onSubmit={onSubmit}
            noValidate
          >
            <div className={fieldClass("projectName")}>
              <div className={`field-input ${form.projectName ? "has-value" : ""}`}>
                <input
                  id="projectName"
                  type="text"
                  value={form.projectName}
                  autoComplete="off"
                  onChange={onProjectNameChange}
                  onFocus={() => onFieldFocus("projectName")}
                  onBlur={() => onFieldBlur("projectName")}
                />
                <label
                  htmlFor="projectName"
                  className={`floating-label ${isProjectNameValid ? "valid" : ""}`}
                >
                  Project Name
                  {isProjectNameValid ? <span className="label-check">✓</span> : null}
                </label>
                {projectNameStatusText ? (
                  <span className={`status-pill ${projectNameStatus}`}>
                    {projectNameStatusText}
                  </span>
                ) : null}
              </div>
              {showError("projectName") ? (
                <p className="error-text">{validationErrors.projectName}</p>
              ) : null}
            </div>

            <div className={fieldClass("email")}>
              <div className={`field-input ${form.email ? "has-value" : ""}`}>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  onChange={(event) => setFieldValue("email", event.target.value)}
                  onFocus={() => onFieldFocus("email")}
                  onBlur={() => onFieldBlur("email")}
                />
                <label
                  htmlFor="email"
                  className={`floating-label ${isEmailValid ? "valid" : ""}`}
                >
                  Work Email
                  {isEmailValid ? <span className="label-check">✓</span> : null}
                </label>
              </div>
              {showError("email") ? (
                <p className="error-text">{validationErrors.email}</p>
              ) : null}
            </div>

            <div className={`${fieldClass("password")} password-field`}>
              <div className={`field-input ${form.password ? "has-value" : ""}`}>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  autoComplete="new-password"
                  onChange={(event) => setFieldValue("password", event.target.value)}
                  onFocus={() => onFieldFocus("password")}
                  onBlur={() => onFieldBlur("password")}
                />
                <label htmlFor="password" className="floating-label">
                  Access Passkey
                </label>
              </div>

              {activeField === "password" && passwordIssues.length > 0 ? (
                <aside className="password-tooltip" role="status" aria-live="polite">
                  <p>Password needs refinement:</p>
                  <ul>
                    {passwordIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </div>

            <div className={fieldClass("projectType")}>
              <CustomSelect
                id="projectType"
                label="Project Type"
                value={form.projectType}
                options={PROJECT_TYPES}
                onChange={onProjectTypeChange}
                onFocusField={() => onFieldFocus("projectType")}
                onBlurField={() => onFieldBlur("projectType")}
                isValid={isProjectTypeValid}
                error={showError("projectType")}
              />
              {showError("projectType") ? (
                <p className="error-text">{validationErrors.projectType}</p>
              ) : null}
            </div>

            <div className={fieldClass("budget")}>
              <div className={`field-input ${form.budget ? "has-value" : ""}`}>
                <input
                  id="budget"
                  type="text"
                  value={form.budget}
                  autoComplete="off"
                  inputMode="numeric"
                  ref={budgetInputRef}
                  onChange={onBudgetChange}
                  onFocus={() => onFieldFocus("budget")}
                  onBlur={() => onFieldBlur("budget")}
                />
                <label
                  htmlFor="budget"
                  className={`floating-label ${isBudgetValid ? "valid" : ""}`}
                >
                  Budget
                  {isBudgetValid ? <span className="label-check">✓</span> : null}
                </label>
              </div>
              {showError("budget") ? (
                <p className="error-text">{validationErrors.budget}</p>
              ) : null}
            </div>

            <div className={fieldClass("dueDate")}>
              <div className={`field-input ${form.dueDate ? "has-value" : ""}`}>
                <input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setFieldValue("dueDate", event.target.value)}
                  onFocus={() => onFieldFocus("dueDate")}
                  onBlur={() => onFieldBlur("dueDate")}
                />
                <label
                  htmlFor="dueDate"
                  className={`floating-label ${isDueDateValid ? "valid" : ""}`}
                >
                  Delivery Date
                  {isDueDateValid ? <span className="label-check">✓</span> : null}
                </label>
              </div>
              {showError("dueDate") ? (
                <p className="error-text">{validationErrors.dueDate}</p>
              ) : null}
            </div>

            <div
              className={`disclosure ${form.projectType === "marketing" ? "open" : ""}`}
              aria-hidden={form.projectType !== "marketing"}
            >
              <div className="disclosure-content">
                <div
                  className={fieldClass("channels", "full")}
                  onFocus={() => onFieldFocus("channels")}
                  onBlur={onChannelBlur}
                >
                  <p className="channel-title">Social Media Channels</p>
                  <div className="channel-grid">
                    {MARKETING_CHANNELS.map((channel) => (
                      <label className="channel-chip" key={channel}>
                        <input
                          type="checkbox"
                          checked={form.channels.includes(channel)}
                          onChange={() => onChannelToggle(channel)}
                        />
                        <span>{channel}</span>
                      </label>
                    ))}
                  </div>
                  {showError("channels") ? (
                    <p className="error-text">{validationErrors.channels}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={fieldClass("brief", "full")}>
              <div className={`field-input ${form.brief ? "has-value" : ""}`}>
                <textarea
                  id="brief"
                  value={form.brief}
                  onChange={(event) => setFieldValue("brief", event.target.value)}
                  onFocus={() => onFieldFocus("brief")}
                  onBlur={() => onFieldBlur("brief")}
                />
                <label
                  htmlFor="brief"
                  className={`floating-label ${isBriefValid ? "valid" : ""}`}
                >
                  Project Brief
                  {isBriefValid ? <span className="label-check">✓</span> : null}
                </label>
              </div>
              {showError("brief") ? (
                <p className="error-text">{validationErrors.brief}</p>
              ) : null}
            </div>

            <div className="form-footer">
              <p className="saved-meta">{savedAtText}</p>
              <button type="submit" className="primary-btn" disabled={isSubmitDisabled}>
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </form>
        )}

        {submitMessage ? (
          <p className="submit-banner" role="status">
            {submitMessage}
          </p>
        ) : null}
      </section>

      {showDiscardDialog ? (
        <div className="dialog-overlay" role="presentation">
          <div
            className="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
          >
            <h3 id="unsaved-title">Unsaved Changes</h3>
            <p>
              Your wizard has unsaved updates. Keep editing or discard changes and
              close the modal.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowDiscardDialog(false)}
              >
                Keep Editing
              </button>
              <button type="button" className="danger-btn" onClick={onDiscardChanges}>
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
