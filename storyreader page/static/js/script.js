document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");

  // ✅ High Contrast Mode Toggle (fixed)
  const contrastToggle = document.getElementById("contrast-toggle");

  function applyHighContrastMode(isEnabled) {
    document.body.classList.toggle("high-contrast", isEnabled);
    contrastToggle.textContent = isEnabled ? "🌈 High Contrast: On" : "🌈 High Contrast: Off";
    localStorage.setItem("highContrast", isEnabled ? "true" : "false");
  }

  if (contrastToggle) {
    contrastToggle.addEventListener("click", () => {
      const isEnabled = document.body.classList.contains("high-contrast");
      applyHighContrastMode(!isEnabled);
    });

    const savedContrastPreference = localStorage.getItem("highContrast");
    if (savedContrastPreference === "true") {
      applyHighContrastMode(true);
    }
  }

  // === Story Reader Page ===
  if (page === "reader") {
    const slides = document.querySelectorAll(".slide");
    let currentSlideIndex = 0;

    const tooltip = document.querySelector(".dictionary-tooltip");
    const popup = document.getElementById("image-popup");
    const popupImg = document.getElementById("popup-img");
    const closeBtn = document.getElementById("close-popup");

    const globalPlayPause = document.getElementById("global-play-pause");
    const speedBtn = document.querySelector(".playback-speed-button");
    const downloadBtn = document.getElementById("download-audio");

    const fontSelect = document.getElementById("font-select");
    const slideTexts = document.querySelectorAll(".slide-text");

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? "block" : "none";
      });
      updateHighlighting(slides[index]);
      updatePlaybackButtonText();
    }

    function updateHighlighting(slide) {
      const audio = slide.querySelector("audio");
      const wordSpans = slide.querySelectorAll("span.word");
      if (!audio || wordSpans.length === 0) return;

      const highlight = () => {
        const currentTime = audio.currentTime;
        wordSpans.forEach(span => {
          const start = parseFloat(span.dataset.start);
          const end = parseFloat(span.dataset.end);
          span.classList.toggle("active-word", currentTime >= start && currentTime <= end);
        });
      };

      const clear = () => {
        wordSpans.forEach(span => span.classList.remove("active-word"));
      };

      audio.addEventListener("timeupdate", highlight);
      audio.addEventListener("ended", clear);

      slide.querySelectorAll(".dict-word").forEach(span => {
        span.addEventListener("mouseenter", e => {
          tooltip.innerHTML = `<img src="${span.getAttribute("data-image")}" alt="word image">`;
          tooltip.style.display = "block";
          tooltip.style.left = `${e.pageX + 15}px`;
          tooltip.style.top = `${e.pageY + 15}px`;
        });
        span.addEventListener("mousemove", e => {
          tooltip.style.left = `${e.pageX + 15}px`;
          tooltip.style.top = `${e.pageY + 15}px`;
        });
        span.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
        span.addEventListener("click", () => {
          popupImg.src = span.getAttribute("data-image");
          popup.style.display = "flex";
        });
      });
    }

    closeBtn.addEventListener("click", () => {
      popup.style.display = "none";
      popupImg.src = '';
    });

    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
        popupImg.src = '';
      }
    });

    function playPause() {
      const currentSlide = slides[currentSlideIndex];
      const audio = currentSlide.querySelector("audio");
      const video = currentSlide.querySelector("video");

      const isPlaying = (audio && !audio.paused) || (video && !video.paused);

      slides.forEach((slide, i) => {
        if (i !== currentSlideIndex) {
          slide.querySelector("audio")?.pause();
          slide.querySelector("video")?.pause();
        }
      });

      if (isPlaying) {
        audio?.pause();
        video?.pause();
        globalPlayPause.textContent = "▶️";
      } else {
        audio?.play();
        video?.play();
        globalPlayPause.textContent = "⏸";
      }
    }

    globalPlayPause.addEventListener("click", playPause);

    downloadBtn.addEventListener("click", () => {
      const currentAudio = slides[currentSlideIndex].querySelector("audio");
      if (!currentAudio) return;

      const link = document.createElement("a");
      link.href = currentAudio.src;
      link.download = "audio.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    document.getElementById("prev-slide").addEventListener("click", () => {
      if (currentSlideIndex > 0) {
        currentSlideIndex--;
        showSlide(currentSlideIndex);
        removePlaybackSpeedMenu();
      }
    });

    document.getElementById("next-slide").addEventListener("click", () => {
      if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        showSlide(currentSlideIndex);
        removePlaybackSpeedMenu();
      }
    });

    function updatePlaybackButtonText() {
      const currentAudio = slides[currentSlideIndex].querySelector("audio");
      const speed = currentAudio?.playbackRate || 1.0;
      const speedText = document.getElementById("speed-indicator");
      if (speedText) speedText.textContent = `${speed}x`;
    }

    function removePlaybackSpeedMenu() {
      document.getElementById("playback-speed-menu")?.remove();
    }

    window.togglePlaybackSpeed = () => {
      const currentAudio = slides[currentSlideIndex].querySelector("audio");
      if (!currentAudio) return;

      removePlaybackSpeedMenu();

      const menu = document.createElement("div");
      menu.id = "playback-speed-menu";
      menu.className = "speed-menu";

      [0.5, 1.0, 1.5, 2.0].forEach(speed => {
        const option = document.createElement("div");
        option.textContent = `${speed}x`;
        option.className = "speed-option";
        if (currentAudio.playbackRate === speed) option.style.fontWeight = "bold";

        option.addEventListener("click", () => {
          currentAudio.playbackRate = speed;
          updatePlaybackButtonText();
          removePlaybackSpeedMenu();
        });

        menu.appendChild(option);
      });

      const rect = speedBtn.getBoundingClientRect();
      Object.assign(menu.style, {
        position: "absolute",
        top: `${rect.bottom + window.scrollY + 6}px`,
        left: `${rect.left + window.scrollX}px`,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "5px 0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        zIndex: 10000
      });

      document.body.appendChild(menu);

      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== speedBtn) {
          removePlaybackSpeedMenu();
          document.removeEventListener("click", closeMenu);
        }
      });
    };

    function applyFont(font) {
      slideTexts.forEach(text => {
        text.style.fontFamily = font || "";
      });
      localStorage.setItem("readerFont", font);
    }

    fontSelect.addEventListener("change", () => {
      applyFont(fontSelect.value);
    });

    const savedFont = localStorage.getItem("readerFont");
    if (savedFont) {
      fontSelect.value = savedFont;
      applyFont(savedFont);
    }

    let currentFontSize = parseInt(localStorage.getItem("fontSize")) || 20;
    applyFontSize(currentFontSize);

    function applyFontSize(size) {
      slideTexts.forEach(text => {
        text.style.fontSize = `${size}px`;
      });
      localStorage.setItem("fontSize", size);
    }

    window.adjustFontSize = (delta) => {
      currentFontSize += delta;
      applyFontSize(currentFontSize);
    };

    window.resetFontSize = () => {
      currentFontSize = 20;
      applyFontSize(currentFontSize);
    };

    showSlide(currentSlideIndex);
  }

  if (page === "home") {
    const searchInput = document.getElementById("search-input");
    const cards = document.querySelectorAll(".story-card");

    searchInput.addEventListener("input", () => {
      const filter = searchInput.value.toLowerCase();
      cards.forEach(card => {
        const title = card.querySelector(".story-title").textContent.toLowerCase();
        card.style.display = title.includes(filter) ? "" : "none";
      });
    });
  }

  let currentSpeed = 1.0;
const minSpeed = 0.25;
const maxSpeed = 2.0;
const step = 0.25;

const speedDisplay = document.getElementById('speed-display');
const decreaseBtn = document.getElementById('decrease');
const increaseBtn = document.getElementById('increase');

function updateSpeedDisplay() {
  speedDisplay.textContent = `${currentSpeed.toFixed(2)}x`;

  // Update all audio elements' playback speed
  document.querySelectorAll("audio").forEach(audio => {
    audio.playbackRate = currentSpeed;
  });
}

decreaseBtn.addEventListener('click', () => {
  if (currentSpeed > minSpeed) {
    currentSpeed = Math.max(minSpeed, currentSpeed - step);
    updateSpeedDisplay();
  }
});

increaseBtn.addEventListener('click', () => {
  if (currentSpeed < maxSpeed) {
    currentSpeed = Math.min(maxSpeed, currentSpeed + step);
    updateSpeedDisplay();
  }
});

// Set initial speed on load
updateSpeedDisplay();

});
