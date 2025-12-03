// ===================================
// Length Converter - JavaScript Logic
// ===================================

// Conversion factors (to meters)
const conversionFactors = {
  // Metric Units
  millimeter: 0.001,
  centimeter: 0.01,
  decimeter: 0.1,
  meter: 1,
  kilometer: 1000,

  // Imperial Units
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.34,

  // Nautical Units
  nautical_mile: 1852,

  // Astronomy
  light_year: 9.461e15,
  astronomical_unit: 1.496e11,
};

// Unit display names
const unitDisplayNames = {
  millimeter: "mm (Millimeter)",
  centimeter: "cm (Centimeter)",
  decimeter: "dm (Decimeter)",
  meter: "m (Meter)",
  kilometer: "km (Kilometer)",
  inch: "in (Inch)",
  foot: "ft (Foot)",
  yard: "yd (Yard)",
  mile: "mi (Mile)",
  nautical_mile: "nmi (Nautical Mile)",
  light_year: "ly (Light Year)",
  astronomical_unit: "AU (Astronomical Unit)",
};

// Unit categories
const unitCategories = {
  "Metric": ["millimeter", "centimeter", "decimeter", "meter", "kilometer"],
  "Imperial": ["inch", "foot", "yard", "mile"],
  "Nautical": ["nautical_mile"],
  "Astronomy": ["light_year", "astronomical_unit"],
};

// Common conversions table
const commonConversions = [
  { from: 1, fromUnit: "meter", toUnit: "foot", description: "1 meter" },
  { from: 1, fromUnit: "kilometer", toUnit: "mile", description: "1 kilometer" },
  { from: 1, fromUnit: "inch", toUnit: "centimeter", description: "1 inch" },
  { from: 1, fromUnit: "yard", toUnit: "meter", description: "1 yard" },
  { from: 1, fromUnit: "mile", toUnit: "kilometer", description: "1 mile" },
  { from: 1, fromUnit: "foot", toUnit: "meter", description: "1 foot" },
];

// DOM Elements
const inputValue = document.getElementById("inputValue");
const fromUnitSelect = document.getElementById("fromUnit");
const toUnitSelect = document.getElementById("toUnit");
const convertBtn = document.getElementById("convertBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const resultValue = document.getElementById("resultValue");
const resultUnit = document.getElementById("resultUnit");
const resultSection = document.getElementById("resultSection");
const conversionTableBody = document.getElementById("conversionTableBody");
const successMessage = document.getElementById("successMessage");

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  populateSelects();
  populateCommonConversions();
  addEventListeners();
});

// Populate select dropdowns
function populateSelects() {
  for (const [category, units] of Object.entries(unitCategories)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = category;

    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unitDisplayNames[unit];
      optgroup.appendChild(option);
    });

    fromUnitSelect.appendChild(optgroup.cloneNode(true));
    toUnitSelect.appendChild(optgroup.cloneNode(true));
  }

  // Set default values
  fromUnitSelect.value = "meter";
  toUnitSelect.value = "foot";
}

// Add event listeners
function addEventListeners() {
  convertBtn.addEventListener("click", performConversion);
  resetBtn.addEventListener("click", resetForm);
  copyBtn.addEventListener("click", copyToClipboard);
  inputValue.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performConversion();
  });
  inputValue.addEventListener("input", () => {
    resultSection.style.display = "none";
    copyBtn.classList.remove("show");
  });
}

// Perform conversion
function performConversion() {
  const value = parseFloat(inputValue.value);
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;

  // Validation
  if (isNaN(value)) {
    showError("Please enter a valid number");
    return;
  }

  if (value < 0) {
    showError("Please enter a positive number");
    return;
  }

  // Conversion calculation
  const valueInMeters = value * conversionFactors[fromUnit];
  const convertedValue = valueInMeters / conversionFactors[toUnit];

  // Format result
  const formattedResult =
    convertedValue > 1000000 || convertedValue < 0.000001
      ? convertedValue.toExponential(6)
      : convertedValue.toFixed(6).replace(/\.?0+$/, "");

  // Display result
  resultValue.textContent = formattedResult;
  resultUnit.textContent = unitDisplayNames[toUnit];
  resultSection.style.display = "block";
  copyBtn.classList.add("show");

  // Store result for copying
  resultValue.dataset.value = convertedValue;
}

// Reset form
function resetForm() {
  inputValue.value = "";
  fromUnitSelect.value = "meter";
  toUnitSelect.value = "foot";
  resultSection.style.display = "none";
  copyBtn.classList.remove("show");
  successMessage.classList.remove("show");
}

// Copy result to clipboard
function copyToClipboard() {
  const text = resultValue.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showSuccess(`Copied: ${text}`);
  });
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.style.cssText = `
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #ef4444;
    color: #ef4444;
    padding: 12px 15px;
    border-radius: 5px;
    margin-top: 15px;
    display: block;
    animation: slideIn 0.3s ease-out;
  `;
  errorDiv.textContent = message;

  const existingError = document.querySelector(".error-message");
  if (existingError) existingError.remove();

  resultSection.parentNode.insertBefore(errorDiv, resultSection.nextSibling);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Show success message
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.add("show");
  setTimeout(() => {
    successMessage.classList.remove("show");
  }, 2000);
}

// Populate common conversions table
function populateCommonConversions() {
  conversionTableBody.innerHTML = "";

  commonConversions.forEach((conversion) => {
    const valueInMeters =
      conversion.from * conversionFactors[conversion.fromUnit];
    const convertedValue =
      valueInMeters / conversionFactors[conversion.toUnit];

    const formattedResult =
      convertedValue > 1000000 || convertedValue < 0.000001
        ? convertedValue.toExponential(4)
        : convertedValue.toFixed(4).replace(/\.?0+$/, "");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${conversion.description}</td>
      <td>${conversion.from} ${unitDisplayNames[conversion.fromUnit].split("(")[1].replace(")", "").trim()}</td>
      <td>=</td>
      <td>${formattedResult} ${unitDisplayNames[conversion.toUnit].split("(")[1].replace(")", "").trim()}</td>
    `;
    conversionTableBody.appendChild(row);
  });
}

// Swap units
function swapUnits() {
  const temp = fromUnitSelect.value;
  fromUnitSelect.value = toUnitSelect.value;
  toUnitSelect.value = temp;
  performConversion();
}

// Format large numbers
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}