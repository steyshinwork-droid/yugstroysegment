document.addEventListener('DOMContentLoaded', function () {

    // ===== MOBILE MENU =====
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');

    if (burger && nav) {
        burger.addEventListener('click', function () {
            burger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close menu on link click
        var navLinks = nav.querySelectorAll('.nav__link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                burger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // ===== HEADER SCROLL EFFECT =====
    var header = document.getElementById('header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
    });

    // ===== REVIEWS CAROUSEL =====
    var track = document.getElementById('reviewsTrack');
    var prevBtn = document.getElementById('prevReview');
    var nextBtn = document.getElementById('nextReview');

    if (track && prevBtn && nextBtn) {
        var currentIndex = 0;
        var cards = track.querySelectorAll('.review-card');
        var totalCards = cards.length;

        function getVisibleCards() {
            var width = window.innerWidth;
            if (width <= 768) return 1;
            if (width <= 1024) return 2;
            return 3;
        }

        function updateCarousel() {
            var visibleCards = getVisibleCards();
            var maxIndex = Math.max(0, totalCards - visibleCards);

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            var card = cards[0];
            var gap = 24;
            var cardWidth = card.offsetWidth + gap;
            var offset = currentIndex * cardWidth;

            track.style.transform = 'translateX(-' + offset + 'px)';
        }

        nextBtn.addEventListener('click', function () {
            var visibleCards = getVisibleCards();
            var maxIndex = Math.max(0, totalCards - visibleCards);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
            }
        });

        prevBtn.addEventListener('click', function () {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        // Touch swipe support
        var startX = 0;
        var isDragging = false;

        track.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });

        track.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
        }, { passive: true });

        track.addEventListener('touchend', function (e) {
            if (!isDragging) return;
            isDragging = false;
            var endX = e.changedTouches[0].clientX;
            var diff = startX - endX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextBtn.click();
                } else {
                    prevBtn.click();
                }
            }
        });

        window.addEventListener('resize', updateCarousel);
    }

    // ===== VIDEO GALLERY — PLAY/PAUSE =====
    var videoItems = document.querySelectorAll('.video-gallery__item');

    videoItems.forEach(function (item) {
        var video = item.querySelector('video');

        item.addEventListener('click', function () {
            if (video.paused) {
                // Pause all other videos
                videoItems.forEach(function (other) {
                    var otherVideo = other.querySelector('video');
                    if (otherVideo !== video && !otherVideo.paused) {
                        otherVideo.pause();
                        other.classList.remove('playing');
                    }
                });
                video.muted = false;
                video.play();
                item.classList.add('playing');
            } else {
                video.pause();
                item.classList.remove('playing');
            }
        });

        video.addEventListener('ended', function () {
            item.classList.remove('playing');
        });
    });

    // ===== LIGHTBOX =====
    var lightbox = document.getElementById('lightbox');
    var lightboxContent = document.getElementById('lightboxContent');
    var lightboxClose = document.getElementById('lightboxClose');
    var lightboxPrev = document.getElementById('lightboxPrev');
    var lightboxNext = document.getElementById('lightboxNext');
    var galleryImages = [];
    var currentLightboxIndex = 0;

    // Collect gallery images
    var galleryItems = document.querySelectorAll('.gallery__item');
    galleryItems.forEach(function (item, index) {
        var img = item.querySelector('img');
        galleryImages.push(img.src);

        item.addEventListener('click', function () {
            currentLightboxIndex = index;
            openLightbox(img.src, 'image');
        });
    });

    function openLightbox(src, type) {
        if (type === 'image') {
            lightboxContent.innerHTML = '<img src="' + src + '" alt="">';
        }
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxContent.innerHTML = '';
        document.body.style.overflow = '';
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', function () {
            currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
            lightboxContent.innerHTML = '<img src="' + galleryImages[currentLightboxIndex] + '" alt="">';
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', function () {
            currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
            lightboxContent.innerHTML = '<img src="' + galleryImages[currentLightboxIndex] + '" alt="">';
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
        if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    });

    // ===== SCROLL ANIMATIONS =====
    var fadeElements = document.querySelectorAll(
        '.product-card, .service-card, .advantage, .review-card, .production__content, .section-title, .gallery__item, .video-gallery__item, .promo-card'
    );

    fadeElements.forEach(function (el) {
        el.classList.add('fade-in');
    });

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(function (el) {
        observer.observe(el);
    });

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ===== ANIMATED COUNTERS IN PRODUCTION SECTION =====
    var stats = document.querySelectorAll('.stat__number');
    var statsAnimated = false;

    function animateCounters() {
        if (statsAnimated) return;

        stats.forEach(function (stat) {
            var text = stat.textContent.trim();
            var isNumber = /^\d+$/.test(text);

            if (isNumber) {
                var target = parseInt(text);
                var current = 0;
                var increment = Math.ceil(target / 60);
                stat.textContent = '0';

                var timer = setInterval(function () {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    stat.textContent = current;
                }, 20);
            }
        });

        statsAnimated = true;
    }

    var productionSection = document.getElementById('production');
    if (productionSection) {
        var productionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounters();
                    productionObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        productionObserver.observe(productionSection);
    }

});
