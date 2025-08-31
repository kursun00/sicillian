// script.js — modern, accessible, gallery, loader, theme, mobile drawer, lightbox, toast
(() => {
    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

    // Toast helper
    const toast = (txt, t = 2000) => {
        const el = $('#toast');
        if (!el) return;
        el.textContent = txt;
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.display = 'none'; }, t);
    };

    // News Data (You can easily edit this array to add, remove, or modify news items)
    const newsData = [
        {
            title: "Geleceğe Adım Atıyoruz!",
            date: "31 Ağustos 2025",
            content: "Sizlerle birlikte büyümeye devam ediyoruz ve topluluğumuzu daha da ileri taşımak için heyecanlıyız. En güncel etkinliklerimiz ve önemli haberlerimiz için Discord sunucumuzu ve sitemizi takipte kalın.",
        },
    ];

    // DOM loaded
    document.addEventListener('DOMContentLoaded', () => {
        const app = $('#app');
        const loader = $('#loader');
        const header = $('#site-header');
        const burger = $('#burger');
        const mobileDrawer = $('#mobileDrawer');
        const backTop = $('#backTop');
        const newsContainer = $('#news-container');

        // Render news cards
        function renderNews() {
            if (!newsContainer) return;
            newsContainer.innerHTML = newsData.map(item => `
                <article class="news-card reveal">
                    <h3>${item.title}</h3>
                    <small>${item.date}</small>
                    <p>${item.content}</p>
                </article>
            `).join('');

            // Apply reveal animation to news cards
            if ('IntersectionObserver' in window) {
                const io = new IntersectionObserver((entries) => {
                    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
                }, { threshold: 0.12 });
                $$('#news-container .news-card').forEach(el => io.observe(el));
            } else {
                $$('#news-container .news-card').forEach(el => el.classList.add('show'));
            }
        }
        renderNews();

        // LOADER fade out once window loads
        window.addEventListener('load', () => {
            if (!loader) return;
            setTimeout(() => {
                loader.style.opacity = '0';
                loader.style.transition = 'opacity .35s ease';
                setTimeout(() => loader.remove(), 420);
            }, 300);
        });

        // HEADER shadow on scroll + back-top
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 20);
            backTop.classList.toggle('show', window.scrollY > 300);
        });

        backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // MOBILE DRAWER
        burger && burger.addEventListener('click', () => {
            const expanded = burger.getAttribute('aria-expanded') === 'true';
            burger.setAttribute('aria-expanded', String(!expanded));
            if (!mobileDrawer) return;
            if (expanded) {
                mobileDrawer.hidden = true;
                mobileDrawer.setAttribute('aria-hidden', 'true');
            } else {
                mobileDrawer.hidden = false;
                mobileDrawer.setAttribute('aria-hidden', 'false');
            }
        });
        $$('.drawer-link').forEach(a => a.addEventListener('click', () => {
            if (mobileDrawer) { mobileDrawer.hidden = true; mobileDrawer.setAttribute('aria-hidden', 'true'); }
            if (burger) burger.setAttribute('aria-expanded', 'false');
        }));

        // IntersectionObserver for general reveals
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
            }, { threshold: 0.12 });
            $$('.reveal').forEach(el => io.observe(el));
            $$('.panel').forEach(el => io.observe(el));
        } else {
            $$('.reveal').forEach(el => el.classList.add('show'));
        }

        /* ===== Gallery logic (thumbs, autoplay, keyboard, swipe, lightbox) ===== */
        const thumbs = $$('#thumbs .thumb');
        const mainImg = $('#mainImg');
        const mainCaption = $('#mainCaption');
        const prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn');
        const autoplayToggle = $('#autoplayToggle'), autoState = $('#autoState');
        const openLightbox = $('#openLightbox');
        const lightbox = $('#lightbox'), lbImg = $('#lbImg'), lbCaption = $('#lbCaption'), lbClose = $('#lbClose');

        let idx = 0;
        let autoplay = true;
        let timer = null;
        const AUTOPLAY_DELAY = 3500;

        // initialize thumbs backgrounds & ARIA
        thumbs.forEach((t, i) => {
            const src = t.dataset.src;
            t.style.backgroundImage = `url('${src}')`;
            t.setAttribute('role', 'button');
            t.setAttribute('aria-pressed', 'false');
            t.addEventListener('click', () => { go(i); resetAutoplay(); });
            t.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(i); resetAutoplay(); } });
        });

        function setActive(n) {
            thumbs.forEach((t, i) => {
                t.classList.toggle('active', i === n);
                t.setAttribute('aria-pressed', String(i === n));
            });
        }

        function go(n) {
            if (!thumbs.length) return;
            if (n < 0) n = thumbs.length - 1;
            if (n >= thumbs.length) n = 0;
            idx = n;
            const src = thumbs[idx].dataset.src;
            const caption = thumbs[idx].dataset.caption || '';
            mainImg.src = src;
            mainImg.alt = caption || `Resim ${idx + 1}`;
            mainCaption.textContent = caption;
            setActive(idx);
            // preload neighbors
            preload(idx + 1); preload(idx - 1);
            // update lightbox if open
            if (lightbox.classList.contains('open')) { lbImg.src = src; lbCaption.textContent = caption; }
        }

        function preload(i) {
            if (!thumbs.length) return;
            if (i < 0) i = thumbs.length - 1;
            if (i >= thumbs.length) i = 0;
            const src = thumbs[i].dataset.src;
            const im = new Image(); im.src = src;
        }

        prevBtn && prevBtn.addEventListener('click', () => { go(idx - 1); resetAutoplay(); });
        nextBtn && nextBtn.addEventListener('click', () => { go(idx + 1); resetAutoplay(); });

        function startAuto() {
            stopAuto();
            timer = setInterval(() => go(idx + 1), AUTOPLAY_DELAY);
            autoplay = true; if (autoState) autoState.textContent = 'Açık';
        }
        function stopAuto() { if (timer) clearInterval(timer); timer = null; autoplay = false; if (autoState) autoState.textContent = 'Kapalı'; }
        function resetAutoplay() { if (autoplay) startAuto(); }

        autoplayToggle && autoplayToggle.addEventListener('click', () => {
            if (autoplay) { stopAuto(); toast('Otomatik oynatma durdu'); } else { startAuto(); toast('Otomatik oynatma başladı'); }
        });

        // lightbox open/close
        openLightbox && openLightbox.addEventListener('click', () => {
            lbImg.src = mainImg.src; lbCaption.textContent = mainCaption.textContent || '';
            lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
        });
        lbClose && lbClose.addEventListener('click', closeLB);
        lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLB(); });
        function closeLB() { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

        // keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { go(idx + 1); resetAutoplay(); }
            if (e.key === 'ArrowLeft') { go(idx - 1); resetAutoplay(); }
            if (e.key === 'Escape') {
                if (lightbox.classList.contains('open')) closeLB();
                if (mobileDrawer && !mobileDrawer.hidden) { mobileDrawer.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
            }
        });

        // touch swipe on galleryMain
        (function addSwipe(el, left, right) {
            if (!el) return;
            let startX = 0, startY = 0, startTime = 0;
            el.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; startX = t.pageX; startY = t.pageY; startTime = Date.now(); }, { passive: true });
            el.addEventListener('touchend', (e) => {
                const t = e.changedTouches[0];
                const dx = t.pageX - startX, dy = t.pageY - startY, dt = Date.now() - startTime;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30 && dt < 700) { if (dx < 0) left(); else right(); }
            });
        })( $('#galleryMain'), () => { go(idx + 1); resetAutoplay(); }, () => { go(idx - 1); resetAutoplay(); });

        // init gallery
        if (thumbs.length) { go(0); startAuto(); }

        // Lazy load images with IntersectionObserver for .lazy
        const lazyImgs = Array.from(document.querySelectorAll('img.lazy'));
        if ('IntersectionObserver' in window && lazyImgs.length) {
            const li = new IntersectionObserver((entries, obs) => {
                entries.forEach(en => {
                    if (en.isIntersecting) {
                        const img = en.target;
                        const src = img.getAttribute('data-src') || img.getAttribute('src');
                        if (src) { img.src = src; img.classList.remove('lazy'); }
                        obs.unobserve(img);
                    }
                });
            }, { rootMargin: '150px' });
            lazyImgs.forEach(i => li.observe(i));
        } else {
            lazyImgs.forEach(i => { i.src = i.getAttribute('data-src'); i.classList.remove('lazy'); });
        }

        // preload small assets
        (new Image()).src = 'logo.png';
        preload(1);

        // initial toast
        toast('Sicillian — site güncellendi ✔', 1800);
    });
})();