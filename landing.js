/* landing.js — render progress meta on the landing page */
(function () {
  const cyber = computeCategoryProgress("cyber", CYBER_PHASES);
  const math = computeCategoryProgress("math", MATH_PLAYLISTS);
  const elCyber = document.getElementById("landCyberMeta");
  const elMath = document.getElementById("landMathMeta");
  if (elCyber) elCyber.textContent = cyber.done + "/" + cyber.total + " selesai · " + cyber.pct + "%";
  if (elMath) elMath.textContent = math.done + "/" + math.total + " video · " + math.pct + "%";
})();
