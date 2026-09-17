document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favoritesGrid");
  const favorites = getFavorites();

  if (!favorites.length) {
    grid.innerHTML = emptyState("No favorites yet — browse Programs or Trainers and tap the heart to save one.");
    return;
  }

  try {
    const [programs, trainers] = await Promise.all([api.getPrograms(), api.getTrainers()]);

    const favoritePrograms = programs.filter((p) =>
      favorites.some((f) => f.type === "program" && f.id === p.id)
    );
    const favoriteTrainers = trainers.filter((t) =>
      favorites.some((f) => f.type === "trainer" && f.id === t.id)
    );

    const cards = [
      ...favoritePrograms.map(programCard),
      ...favoriteTrainers.map(trainerCard),
    ];

    grid.innerHTML = cards.length
      ? cards.join("")
      : emptyState("Your saved favorites are no longer available.");

    bindFavoriteButtons(grid);

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".favorite-btn");
      if (!btn) return;
      setTimeout(() => {
        if (btn.getAttribute("aria-pressed") === "false") {
          btn.closest(".card").remove();
          if (!grid.querySelector(".card")) {
            grid.innerHTML = emptyState("No favorites yet — browse Programs or Trainers and tap the heart to save one.");
          }
        }
      }, 0);
    });
  } catch (err) {
    grid.innerHTML = emptyState("Couldn't load your favorites right now. Make sure the backend server is running.");
  }
});
