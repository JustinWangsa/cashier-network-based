let eyeicon = document.getElementById("eyeicon");
let Password = document.getElementById("Password");

// Eye icon toggle functionality
eyeicon.onclick = function () {
  if (Password.type === "password") {
    Password.type = "text";
    eyeicon.setAttribute("name", "eye-outline");
  } else {
    Password.type = "password";
    eyeicon.setAttribute("name", "eye-off-outline");
  }
};

// Login functionality
const form = document.querySelector("form");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userId = document.getElementById("userId").value;
  const password = document.getElementById("Password").value;

  if (!userId || !password) {
    alert("Please enter both ID and Password");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/db/login_page/log_in", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: userId,
        password: password,
      }),
    });
    const status = await response.text();

    console.log(status);

    switch (status) {
      case "1":
        console.log("aku manager");
        window.location.href = "/src/views/Manager/Main.html"; 
        break;
      case "0":
        console.log("aku kasir");
        window.location.href = "/src/views/Cashier/cashier.html";
        break;
      default:
        alert("Login failed. Please check your ID and Password.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
