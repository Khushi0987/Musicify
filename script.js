// Constants
const ITUNES_API_BASE_URL = "https://itunes.apple.com/search";
const CATEGORIES = {
  pop: "pop music",
  rock: "rock music",
  sad: "sad songs",
  hindi: "hindi songs",
  english: "english songs",
};

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const favoritesList = document.getElementById("favoritesList");
const favoriteHighlights = document.getElementById("favoriteHighlights");
const searchResults = document.getElementById("searchResults");
const searchResultsContainer = document.getElementById(
  "searchResultsContainer"
);
const loadingSpinner = document.getElementById("loadingSpinner");
const clearAllFavoritesBtn = document.getElementById("clearAllFavorites");

let favorites = [];

function initializeTabs() {
  Object.keys(CATEGORIES).forEach((category) => {
    fetchCategorySongs(category, CATEGORIES[category]);
  });

  // Optional: Bootstrap tab change handler
  const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
  tabElements.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", (event) => {
      const activeTabId = event.target.getAttribute("aria-controls");
      console.log(`Switched to tab: ${activeTabId}`);
    });
  });
}

function showLoading(show) {
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? "block" : "none";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadFavorites();
  initializeTabs();
  setupEventListeners();

  if (window.location.pathname.includes("favorite-detail.html")) {
    initializeFavoriteDetailPage();
  } else {
    updateFavoriteHighlights();
    updateFavoritesList();
  }
});

function setupEventListeners() {
  if (searchButton) searchButton.addEventListener("click", performSearch);

  if (searchInput)
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch();
    });

  if (clearAllFavoritesBtn)
    clearAllFavoritesBtn.addEventListener("click", clearAllFavorites);
}

async function fetchCategorySongs(categoryId, searchTerm) {
  const containerElement = document.getElementById(
    `${categoryId}SongsContainer`
  );
  if (!containerElement) return;

  try {
    showLoading(true);
    const response = await fetch(
      `${ITUNES_API_BASE_URL}?term=${encodeURIComponent(
        searchTerm
      )}&entity=song&limit=10`
    );
    const data = await response.json();
    showLoading(false);

    if (data.results && data.results.length > 0) {
      displaySongs(data.results, containerElement);
    } else {
      containerElement.innerHTML = "<p>No songs found.</p>";
    }
  } catch (error) {
    console.error("Error fetching category songs:", error);
    containerElement.innerHTML = "<p>Error loading songs.</p>";
    showLoading(false);
  }
}

async function performSearch() {
  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    alert("Please enter a search term.");
    return;
  }

  try {
    showLoading(true);
    const response = await fetch(
      `${ITUNES_API_BASE_URL}?term=${encodeURIComponent(
        searchTerm
      )}&entity=song&limit=20`
    );
    const data = await response.json();
    showLoading(false);

    // Clear previous results
    searchResultsContainer.innerHTML = "";
    searchResults.classList.remove("d-none");

    if (data.results && data.results.length > 0) {
      displaySongs(data.results, searchResultsContainer);
    } else {
      searchResultsContainer.innerHTML =
        "<p>No results found. Try another query.</p>";
    }
  } catch (error) {
    console.error("Error performing search:", error);
    searchResultsContainer.innerHTML =
      "<p>Error performing search. Please try again.</p>";
    showLoading(false);
  }
}

function displaySongs(songs, container) {
  container.innerHTML = "";
  songs.forEach((song) => {
    const isFavorite = favorites.some((fav) => fav.trackId === song.trackId);
    const songEl = document.createElement("div");
    songEl.className = "col-md-6 col-lg-4 mb-4";
    songEl.innerHTML = `
      <div class="card h-100">
        <img src="${song.artworkUrl100.replace(
          "100x100",
          "300x300"
        )}" class="card-img-top" alt="${song.trackName}">
        <div class="card-body">
          <h5>${song.trackName}</h5>
          <p class="text-muted">${song.artistName}</p>
          <button class="btn ${
            isFavorite ? "btn-danger" : "btn-outline-primary"
          } favorite-btn w-100"
                  data-id="${song.trackId}">
            <i class="fas fa-heart"></i> ${isFavorite ? "Remove" : "Add"}
          </button>
        </div>
      </div>
    `;
    container.appendChild(songEl);
  });

  container
    .querySelectorAll(".favorite-btn")
    .forEach((btn) => btn.addEventListener("click", toggleFavorite));
}

function toggleFavorite(event) {
    const trackId = parseInt(event.currentTarget.getAttribute("data-id"));
    const isFavorited = favorites.some((song) => song.trackId === trackId);
  
    const card = event.currentTarget.closest(".card");
    const songData = {
      trackId,
      trackName: card.querySelector("h5").textContent,
      artistName: card.querySelector(".text-muted").textContent,
      artworkUrl100: card.querySelector("img").src,
    };
  
    if (isFavorited) {
      // Remove from favorites
      favorites = favorites.filter((song) => song.trackId !== trackId);
      event.target.classList.remove("btn-danger", "active");
      event.target.classList.add("btn-outline-primary");
      event.target.innerHTML = '<i class="far fa-heart"></i> Add';
    } else {
      // Add to favorites
      favorites.push(songData);
      event.target.classList.remove("btn-outline-primary");
      event.target.classList.add("btn-danger", "active");
      event.target.innerHTML = '<i class="fas fa-heart"></i> Remove';
    }
  
    saveFavorites();
    updateFavoriteHighlights();
    updateFavoritesList();
  
    // Refresh favorites on detail page
    if (window.location.pathname.includes("favorite-detail.html")) {
      const currentSong = JSON.parse(localStorage.getItem("currentDetailSong"));
      if (
        currentSong &&
        !favorites.some((fav) => fav.trackId === currentSong.trackId)
      ) {
        window.location.href = "index.html";
      }
    }
  }

function updateFavoriteHighlights() {
  if (!favoriteHighlights) return;
  favoriteHighlights.innerHTML = "";

  if (favorites.length === 0) {
    favoriteHighlights.innerHTML = `<div class="col-12 text-center"><p>No favorites yet</p></div>`;
    return;
  }

  favorites.slice(0, 5).forEach((song) => {
    const highlight = document.createElement("div");
    highlight.className = "col-6 col-md-4 col-lg-2 mb-3";
    highlight.innerHTML = `
      <a href="favorite-detail.html?id=${song.trackId}" class="text-decoration-none text-white">
        <img src="${song.artworkUrl100}" class="rounded img-fluid mb-2" width="80" height="80">
        <small>${song.trackName}</small>
      </a>
    `;
    favoriteHighlights.appendChild(highlight);
  });
}

function updateFavoritesList() {
  if (!favoritesList) return;
  favoritesList.innerHTML = "";

  if (favorites.length === 0) {
    favoritesList.innerHTML =
      '<p class="text-center">No favorites added yet.</p>';
    return;
  }

  favorites.forEach((song) => {
    const item = document.createElement("li");
    item.className = "list-group-item d-flex align-items-center";
    item.innerHTML = `
      <img src="${song.artworkUrl100}" width="40" height="40" class="me-3 rounded-circle">
      <strong>${song.trackName}</strong> - <small class="text-muted ms-2">${song.artistName}</small>
    `;
    favoritesList.appendChild(item);
  });
}

function clearAllFavorites() {
  if (confirm("Are you sure you want to remove all favorites?")) {
    favorites = [];
    saveFavorites();
    updateFavoriteHighlights();
    updateFavoritesList();
    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      btn.innerHTML = '<i class="far fa-heart"></i> Add';
      btn.classList.remove("btn-danger");
      btn.classList.add("btn-outline-primary");
    });
  }
}

function saveFavorites() {
  localStorage.setItem("musicifyFavorites", JSON.stringify(favorites));
}

function loadFavorites() {
  const saved = localStorage.getItem("musicifyFavorites");
  if (saved) {
    favorites = JSON.parse(saved);
  }
}

function initializeFavoriteDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const songId = parseInt(urlParams.get("id"));

  const song = favorites.find((f) => f.trackId === songId);

  if (!song) {
    window.location.href = "index.html";
    return;
  }

  localStorage.setItem("currentDetailSong", JSON.stringify(song));

  document.getElementById("songImage").src = song.artworkUrl100.replace(
    "100x100",
    "500x500"
  );
  document.getElementById("songName").textContent = song.trackName;
  document.getElementById("artistName").textContent = song.artistName;
  document.getElementById("albumName").textContent =
    song.collectionName || "Single";

  document.getElementById("toggleFavoriteBtn").addEventListener("click", () => {
    favorites = favorites.filter((f) => f.trackId !== songId);
    saveFavorites();
    updateFavoriteHighlights();
    updateFavoritesList();
    window.location.href = "index.html";
  });

  const detailFavoritesList = document.getElementById("detailFavoritesList");
  detailFavoritesList.innerHTML = "";

  favorites.forEach((fav) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-3 mb-3";
    col.innerHTML = `
      <a href="favorite-detail.html?id=${fav.trackId}" class="text-decoration-none">
        <img src="${fav.artworkUrl100}" class="img-fluid rounded mb-2" alt="${fav.trackName}">
        <p>${fav.trackName}</p>
      </a>
    `;
    detailFavoritesList.appendChild(col);
  });
}
