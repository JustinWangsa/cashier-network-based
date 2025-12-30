// logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/db/login_page/log_out", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 200) {
        console.log("Logged out successfully");

        // Clear any local data
        items = [];
        selectedItemIndex = null;

        // Redirect to login page (cannot go back)
        window.location.replace("../login/login.html");
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Cannot connect to server.");
    }
  });
}
