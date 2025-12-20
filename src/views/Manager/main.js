const input = document.getElementById("imageUpload");
const fileName = document.getElementById("fileName");

input.addEventListener("change", () => {
  if (input.files.length > 0) {
    fileName.textContent = input.files[0].name;
    fileName.classList.remove("hidden");
  }
});
