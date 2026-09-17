const FAVORITES_KEY = "ironline-favorites";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(type, id) {
  return getFavorites().some((f) => f.type === type && f.id === id);
}

function toggleFavorite(type, id) {
  const favorites = getFavorites();
  const index = favorites.findIndex((f) => f.type === type && f.id === id);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push({ type, id });
  }
  saveFavorites(favorites);
  return isFavorite(type, id);
}

function bindFavoriteButtons(container) {
  container.querySelectorAll(".favorite-btn").forEach((btn) => {
    const type = btn.dataset.favType;
    const id = Number(btn.dataset.favId);
    btn.setAttribute("aria-pressed", String(isFavorite(type, id)));
    btn.addEventListener("click", () => {
      const nowFavorite = toggleFavorite(type, id);
      btn.setAttribute("aria-pressed", String(nowFavorite));
    });
  });
}
