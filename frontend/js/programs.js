document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("programGrid");
  const searchInput = document.getElementById("searchInput");
  const chips = document.querySelectorAll(".chip");

  let allPrograms = [];
  let activeCategory = "";

  function render(list) {
    if (!list.length) {
      grid.innerHTML = emptyState("No programs match your search. Try a different filter.");
      return;
    }
    grid.innerHTML = list.map(programCard).join("");
    bindFavoriteButtons(grid);
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allPrograms.filter((p) => {
      const matchesCategory = !activeCategory || p.category === activeCategory;
      const matchesSearch = !term || p.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
    render(filtered);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      activeCategory = chip.dataset.category;
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);

  api
    .getPrograms()
    .then((programs) => {
      allPrograms = programs;
      render(programs);
    })
    .catch(() => {
      grid.innerHTML = emptyState(
        "Couldn't load programs right now. Make sure the backend server is running."
      );
    });
});
