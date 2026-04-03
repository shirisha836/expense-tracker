/* ---------------------------------------------------
   XPENZA — SIGNUP LOGIC
   Handles account creation and validations
--------------------------------------------------- */

// Form elements
const signupForm = document.getElementById("signupForm");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const signupError = document.getElementById("signupError");
const togglePass = document.getElementById("togglePass");

// Modal
const successModal = document.getElementById("successModal");
const goLogin = document.getElementById("goLogin");

// Show/hide password toggle
togglePass.addEventListener("click", () => {
  const isHidden = password.type === "password";

  password.type = isHidden ? "text" : "password";
  confirmPassword.type = isHidden ? "text" : "password";

  togglePass.textContent = isHidden ? "Hide" : "Show";
});

// Helper — Show error message
function showError(message) {
  signupError.textContent = message;
  signupError.style.display = "block";

  setTimeout(() => {
    signupError.style.display = "none";
  }, 3000);
}

// Check if email already exists
function emailExists(emailValue) {
  const users = JSON.parse(localStorage.getItem("xpenza_users") || "[]");
  return users.some(
    (u) => u.email.toLowerCase() === emailValue.toLowerCase()
  );
}

// Handle signup submit
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const fullNameVal = fullName.value.trim();
  const emailVal = email.value.trim();
  const passVal = password.value.trim();
  const confirmVal = confirmPassword.value.trim();

  // VALIDATION
  if (!fullNameVal || !emailVal || !passVal || !confirmVal) {
    showError("All fields are required.");
    return;
  }

  if (passVal.length < 6) {
    showError("Password must be at least 6 characters.");
    return;
  }

  if (passVal !== confirmVal) {
    showError("Passwords do not match.");
    return;
  }

  if (emailExists(emailVal)) {
    showError("An account with this email already exists.");
    return;
  }

  // Save user to localStorage
  const users = JSON.parse(localStorage.getItem("xpenza_users") || "[]");

  users.push({
    fullName: fullNameVal,
    email: emailVal.toLowerCase(),
    password: passVal,
  });

  localStorage.setItem("xpenza_users", JSON.stringify(users));

  // Show success modal
  successModal.style.display = "flex";

  // Auto redirect to login
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1500);
});

// If "Go to Login" is clicked
goLogin.addEventListener("click", () => {
  window.location.href = "index.html";
});
