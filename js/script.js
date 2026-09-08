/* ==================================================
   SETTINGS
================================================== */

const POSTS_PER_PAGE = 15;

let videos = [];
let filteredVideos = [];

let currentPage = 1;


/* ==================================================
   ELEMENTS
================================================== */

const videoGrid =
    document.getElementById("videoGrid");

const popularGrid =
    document.getElementById("popularGrid");

const pageNumber =
    document.getElementById("pageNumber");

const pageInfo =
    document.getElementById("pageInfo");

const prevButton =
    document.getElementById("prevButton");

const nextButton =
    document.getElementById("nextButton");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");


/* ==================================================
   HAMBURGER
================================================== */

const menuButton =
    document.getElementById("menuButton");

const closeMenu =
    document.getElementById("closeMenu");

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("overlay");


function openMenu() {

    sidebar.classList.add("active");

    overlay.classList.add("active");

}


function closeSidebar() {

    sidebar.classList.remove("active");

    overlay.classList.remove("active");

}


menuButton.addEventListener(
    "click",
    openMenu
);


closeMenu.addEventListener(
    "click",
    closeSidebar
);


overlay.addEventListener(
    "click",
    closeSidebar
);


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


/* ==================================================
   LOAD POSTS.JSON
================================================== */

async function loadPosts() {

    try {

        const response =
            await fetch("/posts.json?cache=" + Date.now());

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Format posts.json tidak valid."
            );

        }


        /*
         * Posting terbaru ditaruh paling atas.
         *
         * Worker menambahkan posting baru
         * ke bagian depan posts.json.
         */

        videos = data;

        filteredVideos = [...videos];


        renderPopular();

        renderVideos();


    } catch (error) {

        console.error(
            "Gagal memuat posts.json:",
            error
        );


        videoGrid.innerHTML = `
            <div class="no-result">
                Gagal memuat daftar video.
            </div>
        `;

        popularGrid.innerHTML = "";

    }

}


/* ==================================================
   RENDER VIDEO
================================================== */

function renderVideos() {

    videoGrid.innerHTML = "";


    const totalPages =
        Math.ceil(
            filteredVideos.length /
            POSTS_PER_PAGE
        );


    if (currentPage > totalPages) {

        currentPage =
            totalPages || 1;

    }


    const start =
        (currentPage - 1) *
        POSTS_PER_PAGE;


    const end =
        start + POSTS_PER_PAGE;


    const currentVideos =
        filteredVideos.slice(
            start,
            end
        );


    if (currentVideos.length === 0) {

        videoGrid.innerHTML = `
            <div class="no-result">
                Tidak ada video yang ditemukan.
            </div>
        `;

    }


    currentVideos.forEach(video => {

        const card =
            document.createElement("article");


        card.className =
            "video-card";


        /*
         * URL menuju halaman video.
         */

        const videoUrl =
            "/v/" +
            encodeURIComponent(video.slug) +
            "/";


        /*
         * Thumbnail.
         *
         * Kalau tidak ada thumbnail,
         * tampilkan placeholder VIDEO.
         */

        const thumbnail =
            video.thumbnail
                ? `
                    <img
                        src="${escapeHTML(video.thumbnail)}"
                        alt="${escapeHTML(video.title)}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="thumbnail-placeholder">
                        VIDEO
                    </div>
                `;


        card.innerHTML = `

            <a
                href="${videoUrl}"
                class="video-link"
            >

                <div class="thumbnail">

                    ${thumbnail}

                </div>

                <div class="video-info">

                    <h3>
                        ${escapeHTML(video.title)}
                    </h3>

                    <p>
                        ${escapeHTML(video.description || "")}
                    </p>

                </div>

            </a>

        `;


        videoGrid.appendChild(card);

    });


    updatePagination(totalPages);

}


/* ==================================================
   PAGINATION
================================================== */

function updatePagination(totalPages) {

    const pages =
        totalPages || 1;


    pageNumber.textContent =
        currentPage;


    pageInfo.textContent =
        `Halaman ${currentPage} dari ${pages}`;


    prevButton.disabled =
        currentPage <= 1;


    nextButton.disabled =
        currentPage >= pages;

}


prevButton.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            renderVideos();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

    }
);


nextButton.addEventListener(
    "click",
    () => {

        const totalPages =
            Math.ceil(
                filteredVideos.length /
                POSTS_PER_PAGE
            );


        if (currentPage < totalPages) {

            currentPage++;

            renderVideos();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

    }
);


/* ==================================================
   SEARCH
================================================== */

function searchVideos() {

    const keyword =
        searchInput.value
            .toLowerCase()
            .trim();


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


    currentPage = 1;

    renderVideos();

}


searchInput.addEventListener(
    "input",
    searchVideos
);


searchButton.addEventListener(
    "click",
    searchVideos
);


/* ==================================================
   TOP 3 POPULER
================================================== */

function renderPopular() {

    popularGrid.innerHTML = "";


    /*
     * Ambil postingan yang ditandai popular:true.
     */

    const popularVideos =
        videos
            .filter(video => video.popular === true)
            .slice(0, 3);


    /*
     * Kalau belum ada yang ditandai populer,
     * ambil 3 postingan terbaru.
     */

    const popular =
        popularVideos.length > 0
            ? popularVideos
            : videos.slice(0, 3);


    popular.forEach((video, index) => {

        const card =
            document.createElement("article");


        card.className =
            "popular-card";


        const videoUrl =
            "/v/" +
            encodeURIComponent(video.slug) +
            "/";


        const thumbnail =
            video.thumbnail
                ? `
                    <img
                        src="${escapeHTML(video.thumbnail)}"
                        alt="${escapeHTML(video.title)}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="popular-placeholder">
                        VIDEO
                    </div>
                `;


        card.innerHTML = `

            <a
                href="${videoUrl}"
                class="popular-link"
            >

                <div class="popular-number">
                    ${index + 1}
                </div>

                <div class="popular-thumbnail">

                    ${thumbnail}

                </div>

                <div class="popular-info">

                    <h3>
                        ${escapeHTML(video.title)}
                    </h3>

                    <span>
                        Postingan populer
                    </span>

                </div>

            </a>

        `;


        popularGrid.appendChild(card);

    });

}


/* ==================================================
   INITIALIZE
================================================== */

loadPosts();