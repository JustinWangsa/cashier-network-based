let eyeicon = document.getElementById("eyeicon");
let Password = document.getElementById("Password");

eyeicon.onclick = function () {
  if (Password.type === "password") {
    Password.type = "text";
    eyeicon.setAttribute("name", "eye-outline");
  } else {
    Password.type = "password";
    eyeicon.setAttribute("name", "eye-off-outline");
  }
};
