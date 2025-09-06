/*
 * Simple role‑based routing script.
 * This script reads the 'role' value from localStorage and ensures
 * that users are only able to access pages appropriate to their role.
 * If no role is set, the user is redirected to index.html to select a role.
 */
(function() {
  const role = localStorage.getItem('role');
  const filename = window.location.pathname.split('/').pop();
  // Define pages accessible by each role
  const doctorPages = ['dashboard.html', 'devices.html', 'reports.html', 'staff.html', 'patients.html', 'index.html'];
  const userPages = ['user.html'];
  // Do nothing on login.html, index.html (home) and root pages; these pages handle redirection themselves
  if (filename === '' || filename === 'index.html' || filename === 'login.html') return;
  // If no role yet, send to index for selection
  if (!role) {
    window.location.href = 'index.html';
    return;
  }
  // If a doctor tries to access a user page, redirect to dashboard
  if (role === 'doctor' && userPages.includes(filename)) {
    window.location.href = 'dashboard.html';
    return;
  }
  // If a user tries to access a doctor page, redirect to user dashboard
  if (role === 'user' && doctorPages.includes(filename)) {
    window.location.href = 'user.html';
    return;
  }
  // Otherwise allow access
})();