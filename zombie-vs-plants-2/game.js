(() => {
  const toast = document.getElementById("toast");
  const btnSoon = document.getElementById("btnSoon");
  let hideTimer = 0;

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  if (btnSoon) {
    btnSoon.addEventListener("click", () => {
      showToast("В разработке: миры, магазин и персонаж");
    });
  }
})();
