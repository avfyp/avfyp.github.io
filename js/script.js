const POSTS_PER_PAGE = 15;

const API_URL = "https://avfyp-upload.cntk-njay.workers.dev";

let videos = [];
let filteredVideos = [];
let currentPage = 1;

// ===============================
// ELEMENT
// ===============================

const videoGrid = document.getElementById("videoGrid");
const popularGrid = document.getElementById("popularGrid");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

const pageNumber = document.getElementById("pageNumber");
const pageInfo = document.getElementById("pageInfo");

// ===============================
// LOAD POSTS
// ===============================

async function loadPosts() {
    try {
        const response = await fetch("/posts.json?t=" + Date.now());

        if (!response.ok) {
            throw new Error("Gagal mengambil posts.json");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Format posts.json tidak valid");
        }

        videos = data;
        filteredVideos = [...videos];

        renderVideos();
        loadPopular();

    } catch (error) {
        console.error("Load posts error:", error);

        videoGrid.innerHTML = `
            <div class="message">
                Gagal memuat video.
            </div>
        `;

        popularGrid.innerHTML = `
            <div class="message">
                Gagal memuat video populer.
            </div>
        `;
    }
}

// ===============================
// VIDEO CARD
// ===============================

function createVideoCard(video) {

    const title = video.title || "Tanpa Judul";

    const description =
        video.description ||
        "Tonton video di AVFYP.";

    const slug = video.slug || "";

    const thumbnail =
        video.thumbnail ||
        "https://via.placeholder.com/640x360/151515/ffffff?text=AVFYP";

    return `
        <a
            href="/v/${encodeURIComponent(slug)}/"
            class="video-card"
        >

            <div class="thumbnail">
                <img
                    src="${escapeHtml(thumbnail)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/640x360/151515/ffffff?text=AVFYP'"
                >
            </div>

            <div class="video-info">

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    ${escapeHtml(description)}
                </p>

            </div>

        </a>
    `;
}

// ===============================
// RENDER VIDEOS
// ===============================

function renderVideos() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredVideos.length /
                POSTS_PER_PAGE
            )
        );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start =
        (currentPage - 1) *
        POSTS_PER_PAGE;

    const end =
        start +
        POSTS_PER_PAGE;

    const pageVideos =
        filteredVideos.slice(start, end);

    if (!pageVideos.length) {

        videoGrid.innerHTML = `
            <div class="message">
                Video tidak ditemukan.
            </div>
        `;

    } else {

        videoGrid.innerHTML =
            pageVideos
                .map(createVideoCard)
                .join("");
    }

    updatePagination(totalPages);
}

// ===============================
// PAGINATION
// ===============================

function updatePagination(totalPages) {

    pageNumber.textContent =
        currentPage;

    pageInfo.textContent =
        `Halaman ${currentPage} dari ${totalPages}`;

    prevButton.disabled =
        currentPage <= 1;

    nextButton.disabled =
        currentPage >= totalPages;
}

prevButton.addEventListener("click", () => {

    if (currentPage > 1) {

        currentPage--;

        renderVideos();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
});

nextButton.addEventListener("click", () => {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredVideos.length /
                POSTS_PER_PAGE
            )
        );

    if (currentPage < totalPages) {

        currentPage++;

        renderVideos();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
});

// ===============================
// SEARCH
// ===============================

function doSearch() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!keyword) {

        filteredVideos = [...videos];

    } else {

        filteredVideos =
            videos.filter(video => {

                const title =
                    String(
                        video.title || ""
                    ).toLowerCase();

                const description =
                    String(
                        video.description || ""
                    ).toLowerCase();

                return (
                    title.includes(keyword) ||
                    description.includes(keyword)
                );
            });
    }

    currentPage = 1;

    renderVideos();
}

searchButton.addEventListener(
    "click",
    doSearch
);

searchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            doSearch();
        }
    }
);

// ===============================
// POPULAR
// ===============================

async function loadPopular() {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/popular?t=" +
                Date.now()
            );

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil popular"
            );
        }

        const data =
            await response.json();

        if (
            !data.ok ||
            !Array.isArray(data.posts)
        ) {
            throw new Error(
                "Data popular tidak valid"
            );
        }

        renderPopular(
            data.posts.slice(0, 3)
        );

    } catch (error) {

        console.error(
            "Popular error:",
            error
        );

        // Jika API belum tersedia,
        // gunakan fallback dari posts.json.
        renderPopular(
            videos
                .filter(video => video.popular)
                .slice(0, 3)
        );
    }
}

// ===============================
// POPULAR CARD
// ===============================

function renderPopular(posts) {

    if (!posts.length) {

        popularGrid.innerHTML = `
            <div class="message">
                Belum ada video populer.
            </div>
        `;

        return;
    }

    popularGrid.innerHTML =
        posts
            .map(video => {

                const title =
                    video.title ||
                    "Tanpa Judul";

                const slug =
                    video.slug ||
                    "";

                const thumbnail =
                    video.thumbnail ||
                    "https://via.placeholder.com/640x360/151515/ffffff?text=AVFYP";

                const views =
                    Number(video.views || 0);

                return `
                    <a
                        href="/v/${encodeURIComponent(slug)}/"
                        class="video-card popular-card"
                    >

                        <div class="thumbnail">

                            <img
                                src="${escapeHtml(thumbnail)}"
                                alt="${escapeHtml(title)}"
                                loading="lazy"
                                onerror="this.src='https://via.placeholder.com/640x360/151515/ffffff?text=AVFYP'"
                            >

                            <span class="popular-rank">
                                #${posts.indexOf(video) + 1}
                            </span>

                        </div>

                        <div class="video-info">

                            <h3>
                                ${escapeHtml(title)}
                            </h3>

                            <p>
                                ${formatViews(views)} views
                            </p>

                        </div>

                    </a>
                `;
            })
            .join("");
}

// ===============================
// FORMAT VIEWS
// ===============================

function formatViews(number) {

    number =
        Number(number) || 0;

    if (number >= 1000000) {

        return (
            (number / 1000000)
                .toFixed(1)
                .replace(".0", "") +
            "M"
        );

    }

    if (number >= 1000) {

        return (
            (number / 1000)
                .toFixed(1)
                .replace(".0", "") +
            "K"
        );
    }

    return number.toString();
}

// ===============================
// HTML ESCAPE
// ===============================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===============================
// HAMBURGER MENU
// ===============================

const menuButton =
    document.getElementById(
        "menuButton"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const overlay =
    document.getElementById(
        "overlay"
    );

const closeMenu =
    document.getElementById(
        "closeMenu"
    );

function openSidebar() {

    sidebar.classList.add("active");
    overlay.classList.add("active");

    document.body.classList.add(
        "menu-open"
    );
}

function closeSidebar() {

    sidebar.classList.remove("active");
    overlay.classList.remove("active");

    document.body.classList.remove(
        "menu-open"
    );
}

if (menuButton) {
    menuButton.addEventListener(
        "click",
        openSidebar
    );
}

if (closeMenu) {
    closeMenu.addEventListener(
        "click",
        closeSidebar
    );
}

if (overlay) {
    overlay.addEventListener(
        "click",
        closeSidebar
    );
}

// ===============================
// START
// ===============================

loadPosts();
