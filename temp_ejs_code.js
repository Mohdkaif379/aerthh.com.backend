
  const bannerSrc = (typeof banners !== 'undefined') ? banners : [];
  const bannerList = Array.isArray(bannerSrc) && bannerSrc.length ? bannerSrc : [
    { image: "https://via.placeholder.com/1920x600/3b82f6/ffffff?text=Banner+1", banner_type: "Banner 1" },
    { image: "https://via.placeholder.com/1920x600/8b5cf6/ffffff?text=Banner+2", banner_type: "Banner 2" },
    { image: "https://via.placeholder.com/1920x600/ec489a/ffffff?text=Banner+3", banner_type: "Banner 3" }
  ];
  const catSrc = (typeof categories !== 'undefined') ? categories : [];
  const catList = Array.isArray(catSrc) ? catSrc : [];
  const apiBase = typeof apiBase !== 'undefined' ? apiBase : '';

  const dots = bannerList.map((_, idx) =>
    `<button class="carousel-dot w-2 h-2 md:w-3 md:h-3 rounded-full ${idx === 0 ? 'bg-white dot-active' : 'bg-white/50'} hover:bg-white transition-all duration-200"></button>`
  ).join('');

  const slideHtml = bannerList.map((banner, idx) =>
    `<div class="carousel-slide shadow-xl absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === 0 ? 'opacity-100' : 'opacity-0'}">
        <img src="${banner.image}" alt="${banner.banner_type || 'Banner'}" class="w-full h-full object-cover rounded-2xl" />
     </div>`
  ).join('');

  const renderCategories = (cats = []) => cats.map(cat => `
    <div class="cat-card min-w-[120px] flex-shrink-0 flex flex-col items-center gap-2 bg-gray-50 rounded-2xl p-3 shadow-sm transition-transform hover:-translate-y-1">
      <div class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow flex items-center justify-center overflow-hidden ring-2 ring-emerald-100">
        <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover">
      </div>
      <span class="text-sm font-semibold text-gray-800 text-center leading-tight">${cat.name}</span>
    </div>
  `).join('');

  const body = `
<style>
  .hide-scroll::-webkit-scrollbar { width: 0; height: 0; }
  .hide-scroll { scrollbar-width: none; }
</style>
<!-- Banner Carousel Section -->
<section class="w-full pt-2 pb-8">
  <div class="w-full px-0">
    <div class="relative w-full overflow-hidden shadow-xl rounded-2xl">
      <div class="relative h-64 md:h-96 lg:h-[500px] overflow-hidden rounded-2xl">
        ${slideHtml}
      </div>
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        ${dots}
      </div>
    </div>
  </div>
</section>



<section class="py-8 bg-white">
  <div class="w-full px-4 md:px-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Categories</h2>
      <div class="hidden md:flex gap-2">
        <button class="cat-nav cat-prev w-9 h-9 rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 active:scale-95 transition">‹</button>
        <button class="cat-nav cat-next w-9 h-9 rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 active:scale-95 transition">›</button>
      </div>
    </div>
    <div class="relative">
      <div class="cat-track flex gap-4 overflow-x-auto pb-2 hide-scroll scroll-smooth">
        <!-- categories will be injected via JS -->
      </div>
      <div class="md:hidden mt-3 flex justify-center gap-3">
        <button class="cat-nav cat-prev w-10 h-10 rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 active:scale-95 transition">‹</button>
        <button class="cat-nav cat-next w-10 h-10 rounded-full border border-gray-200 bg-white shadow hover:bg-gray-50 active:scale-95 transition">›</button>
      </div>
    </div>
  </div>
</section>

<script>
  (function() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    let autoSlideInterval;

    function showSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentSlide = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle('opacity-100', i === currentSlide);
        slide.classList.toggle('opacity-0', i !== currentSlide);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-white', i === currentSlide);
        dot.classList.toggle('bg-white/50', i !== currentSlide);
      });
    }

    function nextSlide() { showSlide(currentSlide + 1); resetAutoSlide(); }
    function resetAutoSlide() { clearInterval(autoSlideInterval); autoSlideInterval = setInterval(nextSlide, 5000); }

    dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); resetAutoSlide(); }));
    autoSlideInterval = setInterval(nextSlide, 5000);
    const carousel = document.querySelector('.relative.w-full.overflow-hidden');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
      carousel.addEventListener('mouseleave', () => { autoSlideInterval = setInterval(nextSlide, 5000); });
    }

    // auto-scroll categories horizontally
    const catTrack = document.querySelector('.cat-track');
    const catNavButtons = document.querySelectorAll('.cat-nav');

    async function loadCategories() {
      if (!catTrack || !apiBase) return;
      const endpoint = `${apiBase}categories`;
      try {
        const resp = await fetch(endpoint);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const list = Array.isArray(data.data) ? data.data : [];
        catTrack.innerHTML = renderCategories(list);
        initCatCarousel();
      } catch (err) {
        console.error('Failed to load categories:', err.message || err);
        catTrack.innerHTML = '<div class="text-sm text-gray-500">Categories unavailable</div>';
      }
    }

    function initCatCarousel() {
      const items = Array.from(catTrack.children).filter(el => el.classList.contains('cat-card'));
      if (!items.length) return;
      let catIndex = 0;

      const scrollToItem = (idx, smooth = true) => {
        const target = items[idx];
        if (!target) return;
        catTrack.scrollTo({
          left: target.offsetLeft - 12,
          behavior: smooth ? 'smooth' : 'instant'
        });
      };

      const nextCat = () => {
        catIndex = (catIndex + 1) % items.length;
        scrollToItem(catIndex);
      };

      const prevCat = () => {
        catIndex = (catIndex - 1 + items.length) % items.length;
        scrollToItem(catIndex);
      };

      // autoplay every 3s
      let catInterval = setInterval(nextCat, 3000);

      catNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          clearInterval(catInterval);
          if (btn.classList.contains('cat-next')) nextCat();
          else prevCat();
          catInterval = setInterval(nextCat, 3000);
        });
      });

      // pause on hover/touch
      ['mouseenter', 'touchstart', 'focusin'].forEach(evt => {
        catTrack.addEventListener(evt, () => clearInterval(catInterval));
      });
      ['mouseleave', 'touchend', 'focusout'].forEach(evt => {
        catTrack.addEventListener(evt, () => { catInterval = setInterval(nextCat, 3000); });
      });

      // initial alignment
      scrollToItem(0, false);
    }

    loadCategories();
  })();
</script>
`; 