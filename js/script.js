/* =====================================================
   AVFYP - MAIN SCRIPT
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       ELEMENT
       ================================================= */

    const menuButton = document.getElementById("menuButton");
    const closeMenu = document.getElementById("closeMenu");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    const videoGrid = document.getElementById("videoGrid");
    const popularGrid = document.getElementById("popularGrid");

    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");

    const pageNumber = document.getElementById("pageNumber");
    const pageInfo = document.getElementById("pageInfo");


    /* =================================================
       MENU
       ================================================= */

    function openMenu() {

        if (sidebar) {
            sidebar.classList.add("active");
        }

        if (overlay) {
            overlay.classList.add("active");
        }

        document.body.style.overflow = "hidden";
    }


    function closeSidebar() {

        if (sidebar) {
            sidebar.classList.remove("active");
        }

        if (overlay) {
            overlay.classList.remove("active");
        }

        document.body.style.overflow = "";
    }


    if (menuButton) {
        menuButton.addEventListener("click", (event) => {
            event.preventDefault();
            openMenu();
        });
    }


    if (closeMenu) {
        closeMenu.addEventListener("click", (event) => {
            event.preventDefault();
            closeSidebar();
        });
    }


    if (overlay) {
        overlay.addEventListener("click", () => {
            closeSidebar();
        });
    }


    /* =================================================
       ESC UNTUK TUTUP SIDEBAR
       ================================================= */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    });


    /* =================================================
       DATA
       ================================================= */

    let allPosts = [];

    let filteredPosts = [];

    let currentPage = 1;

    const POSTS_PER_PAGE = 15;


    /* =================================================
       LOAD POSTS
       ================================================= */

    async function loadPosts() {

        showLoading();

        try {

            const response = await fetch(
                "/posts.json?v=" + Date.now(),
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "HTTP " + response.status
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    "posts.json bukan array"
                );
            }

            allPosts = data;

            filteredPosts = [...allPosts];

            currentPage = 1;

            renderVideos();

            renderPopular();

        } catch (error) {

            console.error(
                "Gagal memuat posts.json:",
                error
            );

            showError();

        }

    }


    /* =================================================
       LOADING
       ================================================= */

    function showLoading() {

        if (!videoGrid) {
            return;
        }

        videoGrid.innerHTML = `
            <div class="empty-message">
                Memuat video...
            </div>
        `;

    }


    /* =================================================
       ERROR
       ================================================= */

    function showError() {

        if (!videoGrid) {
            return;
        }

        videoGrid.innerHTML = `
            <div class="empty-message">
                Gagal memuat video.
                <br>
                <small>
                    Silakan refresh halaman.
                </small>
            </div>
        `;

        if (popularGrid) {
            popularGrid.innerHTML = "";
        }

        updatePagination(0);

    }


    /* =================================================
       ESCAPE HTML
       ================================================= */

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =================================================
       SLUG
       ================================================= */

    function getSlug(post) {

        if (post.slug) {
            return String(post.slug);
        }

        if (post.id !== undefined) {
            return String(post.id);
        }

        return "";

    }


    /* =================================================
       VIDEO URL
       ================================================= */

    function getVideoUrl(post) {

        const slug = getSlug(post);

        if (!slug) {
            return "#";
        }

        return "/v/" +
            encodeURIComponent(slug) +
            "/";

    }


    /* =================================================
       THUMBNAIL
       ================================================= */

    function getThumbnail(post) {

        if (
            post.thumbnail &&
            String(post.thumbnail).trim() !== ""
        ) {

            return String(post.thumbnail);

        }

        /*
         * Thumbnail fallback.
         * Kalau thumbnail kosong, gunakan
         * tampilan hitam dengan tombol play.
         */

        return "";

    }


    /* =================================================
       RENDER VIDEO CARD
       ================================================= */

    function createVideoCard(post) {

        const title = escapeHtml(
            post.title || "Tanpa Judul"
        );

        const description = escapeHtml(
            post.description || ""
        );

        const url = getVideoUrl(post);

        const thumbnail = getThumbnail(post);


        let thumbnailHtml = "";

        if (thumbnail) {

            thumbnailHtml = `
                <img
                    src="${escapeHtml(thumbnail)}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            `;

        }


        return `
            <a
                class="video-card"
                href="${url}"
            >

                <div class="video-thumbnail">
                    ${thumbnailHtml}
                </div>

                <div class="video-info">

                    <div class="video-title">
                        ${title}
                    </div>

                    ${
                        description
                        ? `
                            <div class="video-description">
                                ${description}
                            </div>
                        `
                        : ""
                    }

                </div>

            </a>
        `;

    }


    /* =================================================
       RENDER VIDEO
       ================================================= */

    function renderVideos() {

        if (!videoGrid) {
            return;
        }


        if (filteredPosts.length === 0) {

            videoGrid.innerHTML = `
                <div class="empty-message">
                    Video tidak ditemukan.
                </div>
            `;

            updatePagination(0);

            return;
        }


        const totalPages = Math.ceil(
            filteredPosts.length / POSTS_PER_PAGE
        );


        if (currentPage > totalPages) {
            currentPage = totalPages;
        }


        if (currentPage < 1) {
            currentPage = 1;
        }


        const startIndex =
            (currentPage - 1) *
            POSTS_PER_PAGE;


        const endIndex =
            startIndex +
            POSTS_PER_PAGE;


        const pagePosts =
            filteredPosts.slice(
                startIndex,
                endIndex
            );


        videoGrid.innerHTML =
            pagePosts
                .map(createVideoCard)
                .join("");


        updatePagination(totalPages);

    }


    /* =================================================
       PAGINATION
       ================================================= */

    function updatePagination(totalPages) {

        if (pageNumber) {

            pageNumber.textContent =
                totalPages > 0
                ? currentPage
                : "0";

        }


        if (pageInfo) {

            pageInfo.textContent =
                totalPages > 0
                ? `Halaman ${currentPage} / ${totalPages}`
                : "Tidak ada video";

        }


        if (prevButton) {

            prevButton.disabled =
                currentPage <= 1 ||
                totalPages <= 1;

        }


        if (nextButton) {

            nextButton.disabled =
                currentPage >= totalPages ||
                totalPages <= 1;

        }

    }


    /* =================================================
       PREVIOUS
       ================================================= */

    if (prevButton) {

        prevButton.addEventListener(
            "click",
            () => {

                if (currentPage > 1) {

                    currentPage--;

                    renderVideos();

                    scrollToVideos();

                }

            }
        );

    }


    /* =================================================
       NEXT
       ================================================= */

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => {

                const totalPages =
                    Math.ceil(
                        filteredPosts.length /
                        POSTS_PER_PAGE
                    );


                if (currentPage < totalPages) {

                    currentPage++;

                    renderVideos();

                    scrollToVideos();

                }

            }
        );

    }


    /* =================================================
       SCROLL KE VIDEO
       ================================================= */

    function scrollToVideos() {

        const section =
            videoGrid?.closest("section");

        if (!section) {
            return;
        }

        const headerHeight = 70;

        const top =
            section.getBoundingClientRect().top +
            window.scrollY -
            headerHeight;

        window.scrollTo({
            top: Math.max(0, top),
            behavior: "smooth"
        });

    }


    /* =================================================
       SEARCH
       ================================================= */

    function performSearch() {

        const keyword =
            searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


        if (!keyword) {

            filteredPosts =
                [...allPosts];

        } else {

            filteredPosts =
                allPosts.filter((post) => {

                    const title =
                        String(
                            post.title || ""
                        ).toLowerCase();


                    const description =
                        String(
                            post.description || ""
                        ).toLowerCase();


                    const slug =
                        String(
                            post.slug || ""
                        ).toLowerCase();


                    return (
                        title.includes(keyword) ||
                        description.includes(keyword) ||
                        slug.includes(keyword)
                    );

                });

        }


        currentPage = 1;

        renderVideos();

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performSearch();

                }

            }
        );


        searchInput.addEventListener(
            "input",
            () => {

                if (
                    searchInput.value.trim() === ""
                ) {

                    filteredPosts =
                        [...allPosts];

                    currentPage = 1;

                    renderVideos();

                }

            }
        );

    }


    /* =================================================
       POPULAR
       ================================================= */

    function renderPopular() {

        if (!popularGrid) {
            return;
        }


        if (allPosts.length === 0) {

            popularGrid.innerHTML = "";

            return;
        }


        /*
         * Untuk sementara:
         * post dengan popular:true akan diprioritaskan.
         *
         * Jika nanti D1 sudah terhubung ke homepage,
         * bagian ini bisa diganti menjadi sorting
         * berdasarkan total views.
         */

        const popularPosts =
            allPosts
                .filter(
                    post => post.popular === true
                )
                .slice(0, 3);


        /*
         * Kalau belum ada popular:true,
         * ambil 3 post pertama sebagai fallback.
         */

        const finalPopular =
            popularPosts.length > 0
            ? popularPosts
            : allPosts.slice(0, 3);


        popularGrid.innerHTML =
            finalPopular
                .map(
                    (post, index) =>
                        createPopularCard(
                            post,
                            index + 1
                        )
                )
                .join("");

    }


    /* =================================================
       POPULAR CARD
       ================================================= */

    function createPopularCard(
        post,
        rank
    ) {

        const title = escapeHtml(
            post.title || "Tanpa Judul"
        );

        const url = getVideoUrl(post);

        const thumbnail =
            getThumbnail(post);


        let thumbnailHtml = "";

        if (thumbnail) {

            thumbnailHtml = `
                <img
                    src="${escapeHtml(thumbnail)}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            `;

        }


        return `
            <a
                class="popular-card"
                href="${url}"
            >

                <div class="popular-thumbnail">
                    ${thumbnailHtml}
                </div>

                <div class="popular-info">

                    <div class="popular-rank">
                        #${rank}
                    </div>

                    <div class="popular-title">
                        ${title}
                    </div>

                </div>

            </a>
        `;

    }


    /* =================================================
       SIDEBAR LINK
       ================================================= */

    if (sidebar) {

        const sidebarLinks =
            sidebar.querySelectorAll("a");

        sidebarLinks.forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    closeSidebar();

                }
            );

        });

    }


    /* =================================================
       START
       ================================================= */

    loadPosts();

});
