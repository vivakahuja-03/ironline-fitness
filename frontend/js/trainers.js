document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("trainerGrid");
  const searchInput = document.getElementById("searchInput");
  const chips = document.querySelectorAll(".chip");

  let allTrainers = [];
  let activeSpecialty = "";

  function render(list) {
    if (!list.length) {
      grid.innerHTML = emptyState("No trainers match your search. Try a different filter.");
      return;
    }
    grid.innerHTML = list.map(trainerCard).join("");
    bindFavoriteButtons(grid);
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allTrainers.filter((t) => {
      const matchesSpecialty = !activeSpecialty || t.specialty === activeSpecialty;
      const matchesSearch = !term || t.name.toLowerCase().includes(term);
      return matchesSpecialty && matchesSearch;
    });
    render(filtered);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      activeSpecialty = chip.dataset.specialty;
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);

  api
    .getTrainers()
    .then((trainers) => {
      allTrainers = trainers;
      render(trainers);
    })
    .catch(() => {
      grid.innerHTML = emptyState(
        "Couldn't load trainers right now. Make sure the backend server is running."
      );
    });
});
