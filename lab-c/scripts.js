"use strict";

const GRID_SIZE = 4;
const PIECES_COUNT = GRID_SIZE * GRID_SIZE;
const IMAGE_SIZE = 400;

const mapCanvas = document.querySelector("#mapCanvas");
const piecesContainer = document.querySelector("#piecesContainer");
const board = document.querySelector("#board");

const locationBtn = document.querySelector("#locationBtn");
const downloadBtn = document.querySelector("#downloadBtn");

const coordinates = document.querySelector("#coordinates");
const statusText = document.querySelector("#status");
const puzzleStatus = document.querySelector("#puzzleStatus");

let map = null;
let locationMarker = null;
let pieceImages = [];
let puzzleCompleted = false;

function setStatus(message) {
  statusText.textContent = message;
}
function initializeMap() {
  if (typeof L === "undefined") {
    setStatus("Nie udało się załadować biblioteki Leaflet.");
    return;
  }

  map = L.map("map").setView(
    [53.4285, 14.5528],
    13
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      crossOrigin: true,
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  setStatus("Mapa została załadowana.");
}
function showMyLocation() {
  if (!map) {
    setStatus("Mapa nie jest dostępna.");
    return;
  }

  if (!navigator.geolocation) {
    setStatus("Przeglądarka nie obsługuje geolokalizacji.");
    return;
  }

  setStatus("Pobieranie lokalizacji...");

  navigator.geolocation.getCurrentPosition(
    function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      coordinates.textContent =
        `Współrzędne: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      map.setView([lat, lng], 15);

      if (locationMarker) {
        map.removeLayer(locationMarker);
      }

      locationMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup("Moja lokalizacja")
        .openPopup();

      setStatus("Lokalizacja została oznaczona na mapie.");
    },

    function(error) {
      setStatus(
        "Nie udało się pobrać lokalizacji: " + error.message
      );
    },

    {
      enableHighAccuracy: false,
      timeout: 15000
    }
  );
}
function requestNotifications() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().catch(function(error) {
      console.debug("Powiadomienia:", error);
    });
  }
}
function captureMap() {
  if (!map || typeof leafletImage !== "function") {
    setStatus("Brakuje biblioteki do eksportu mapy.");
    return;
  }

  requestNotifications();

  downloadBtn.disabled = true;
  setStatus("Zapisywanie aktualnego widoku mapy...");

  leafletImage(map, function(error, capturedCanvas) {
    downloadBtn.disabled = false;

    if (error || !capturedCanvas) {
      console.error("Błąd eksportu:", error);

      setStatus(
        "Nie udało się pobrać mapy. " +
        "Poczekaj na załadowanie kafelków i spróbuj ponownie."
      );

      return;
    }

    try {
      const context = mapCanvas.getContext("2d");

      mapCanvas.width = IMAGE_SIZE;
      mapCanvas.height = IMAGE_SIZE;

      const cropSize = Math.min(
        capturedCanvas.width,
        capturedCanvas.height
      );

      const cropX =
        (capturedCanvas.width - cropSize) / 2;

      const cropY =
        (capturedCanvas.height - cropSize) / 2;

      context.clearRect(
        0, 0, IMAGE_SIZE, IMAGE_SIZE
      );

      context.drawImage(
        capturedCanvas,
        cropX,
        cropY,
        cropSize,
        cropSize,
        0,
        0,
        IMAGE_SIZE,
        IMAGE_SIZE
      );

      splitMapIntoPieces();

      setStatus(
        "Mapa została zapisana w Canvas " +
        "i podzielona na 16 elementów."
      );

    } catch (error) {
      console.error(error);

      setStatus(
        "Nie udało się przetworzyć obrazu mapy. " +
        "Możliwy problem z CORS."
      );
    }
  });
}
function splitMapIntoPieces() {
  pieceImages = [];

  const pieceWidth = mapCanvas.width / GRID_SIZE;
  const pieceHeight = mapCanvas.height / GRID_SIZE;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {

      const pieceCanvas =
        document.createElement("canvas");

      pieceCanvas.width = pieceWidth;
      pieceCanvas.height = pieceHeight;

      const context =
        pieceCanvas.getContext("2d");

      context.drawImage(
        mapCanvas,

        col * pieceWidth,
        row * pieceHeight,

        pieceWidth,
        pieceHeight,

        0,
        0,

        pieceWidth,
        pieceHeight
      );

      pieceImages.push(
        pieceCanvas.toDataURL("image/png")
      );
    }
  }

  shufflePieces();
}
function createCells(container) {
  container.replaceChildren();

  for (let i = 0; i < PIECES_COUNT; i++) {
    const cell = document.createElement("div");

    cell.className = "puzzle-cell";
    cell.dataset.index = String(i);

    cell.addEventListener("dragover", function(event) {
      event.preventDefault();

      cell.classList.add("drag-over");
    });

    cell.addEventListener("dragleave", function() {
      cell.classList.remove("drag-over");
    });

    cell.addEventListener("drop", handleDrop);

    container.appendChild(cell);
  }
}
function shufflePieces() {
  createCells(piecesContainer);
  createCells(board);

  puzzleCompleted = false;

  const order = Array.from(
    { length: PIECES_COUNT },
    (_, index) => index
  );

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [order[i], order[j]] = [
      order[j], order[i]
    ];
  }

  order.forEach(function(pieceId, index) {
    const image = document.createElement("img");

    image.src = pieceImages[pieceId];
    image.alt = `Element puzzli ${pieceId + 1}`;

    image.className = "puzzle-piece";
    image.draggable = true;

    image.dataset.pieceId = String(pieceId);

    image.addEventListener("dragstart", function(event) {
      event.dataTransfer.setData(
        "text/plain",
        String(pieceId)
      );

      event.dataTransfer.effectAllowed = "move";

      image.classList.add("dragging");
    });

    image.addEventListener("dragend", function() {
      image.classList.remove("dragging");
    });

    piecesContainer.children[index].appendChild(image);
  });

  puzzleStatus.textContent =
    "Przeciągnij elementy na planszę po prawej stronie.";

  console.debug("Utworzono 16 elementów puzzli.");
}

function handleDrop(event) {
  event.preventDefault();

  const targetCell = event.currentTarget;

  targetCell.classList.remove("drag-over");

  const pieceId =
    event.dataTransfer.getData("text/plain");

  const draggedPiece = Array.from(
    document.querySelectorAll(".puzzle-piece")
  ).find(function(piece) {
    return piece.dataset.pieceId === pieceId;
  });

  if (!draggedPiece) {
    return;
  }

  const sourceCell = draggedPiece.parentElement;

  if (sourceCell === targetCell) {
    return;
  }

  const targetPiece =
    targetCell.querySelector(".puzzle-piece");

  if (targetPiece) {
    sourceCell.appendChild(targetPiece);
  }

  targetCell.appendChild(draggedPiece);

  checkPuzzle();
}

function checkPuzzle() {
  const cells = Array.from(board.children);

  let correctCount = 0;

  cells.forEach(function(cell, index) {
    const piece =
      cell.querySelector(".puzzle-piece");

    if (!piece) {
      return;
    }

    if (piece.dataset.pieceId === String(index)) {
      correctCount++;
      piece.classList.add("correct");
    } else {
      piece.classList.remove("correct");
    }
  });

  puzzleStatus.textContent =
    `Poprawnie ułożone elementy: ${correctCount} / ${PIECES_COUNT}`;

  if (
    correctCount === PIECES_COUNT &&
    !puzzleCompleted
  ) {
    puzzleCompleted = true;

    console.debug(
      "Puzzle completed! Wszystkie 16 elementów " +
      "są na właściwych miejscach."
    );

    puzzleStatus.textContent =
      "Gratulacje! Wszystkie puzzle zostały poprawnie ułożone!";

    showWinNotification();
  }
}

function showWinNotification() {
  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification("Gratulacje!", {
        body: "Puzzle zostały poprawnie ułożone."
      });
    } catch (error) {
      console.error("Błąd powiadomienia:", error);
    }
  } else {
    setStatus(
      "Puzzle ukończone. Powiadomienia systemowe nie są dozwolone."
    );
  }
}


createCells(piecesContainer);
createCells(board);

initializeMap();

locationBtn.addEventListener(
  "click",
  showMyLocation
);

downloadBtn.addEventListener(
  "click",
  captureMap
);
