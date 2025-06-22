document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('active');
  });
});

function showImage(image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = '排球圖片';
    img.style.width = '100%';
    img.style.height = 'auto';
    document.body.appendChild(img);
}
function loadVideo() {
  const container = document.getElementById("videoContainer");
  container.innerHTML = `
    <iframe src="https://www.youtube.com/embed/uqS9gUnhz4I?autoplay=1"
            frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
    </iframe>
  `;
  document.querySelector(".video-preview").style.display = "none";
}
let currentIndex = 0;

function updateCarousel() {
  const track = document.querySelector('.carousel-track');
  const slides = document.querySelectorAll('.carousel-track img');
  const slideWidth = slides[0].clientWidth; // 單張寬度
  track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
}


function prevSlide() {
  const slides = document.querySelectorAll('.carousel-track img');
  currentIndex = Math.max(currentIndex - 1, 0);
  updateCarousel();
}

function nextSlide() {
  const slides = document.querySelectorAll('.carousel-track img');
  const maxIndex = slides.length - 2; // 每次顯示2張
  currentIndex = Math.min(currentIndex + 1, maxIndex);
  updateCarousel();
}


window.addEventListener('resize', updateCarousel);
window.addEventListener('DOMContentLoaded', updateCarousel);
