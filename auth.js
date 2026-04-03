/* ---------------------------------------------------
   XPENZA — LOGIN AUTHENTICATION
   Validates login using saved accounts from signup
--------------------------------------------------- */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const togglePass = document.getElementById("togglePass");

// Show/Hide Password
togglePass.addEventListener("click", () => {
  const isHidden = passInput.type === "password";
  passInput.type = isHidden ? "text" : "password";
  togglePass.textContent = isHidden ? "Hide" : "Show";
});

// Show error function
function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.style.display = "block";
  setTimeout(() => {
    loginError.style.display = "none";
  }, 3000);
}

// Login validation
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const emailVal = emailInput.value.trim().toLowerCase();
  const passVal = passInput.value.trim();

  const users = JSON.parse(localStorage.getItem("xpenza_users") || "[]");

  const matchedUser = users.find(
    (u) => u.email === emailVal && u.password === passVal
  );

  if (!matchedUser) {
    showLoginError("Incorrect email or password.");
    return;
  }

  // Save login session
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("loggedUser", JSON.stringify(matchedUser));

  // Redirect to dashboard
  window.location.href = "dashboard.html";
});
