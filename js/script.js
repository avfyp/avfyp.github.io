
const POSTS_URL = "/posts.json";
const WORKER_URL = "https://avfyp-upload.cntk-njay.workers.dev";

const POSTS_PER_PAGE = 15;

let videos = [];
let filteredVideos = [];

let currentPage = 1;


// =====================================================
// ELEMENT
// =====================================================

const videoGrid =
    document.getElementById("videoGrid");

const popularGrid =
    document.getElementById("popularGrid");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const prevButton =
    document.getElementById("prevButton");

const nextButton =
    document.getElementById("nextButton");

const pageNumber =
    document.getElementById("pageNumber");

const pageInfo =
    document.getElementById("pageInfo");


// =====================================================
// MENU
// =====================================================

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

const overlay =
    document.getElementById("overlay");

const closeMenu =
    document.getElementById("closeMenu");


function openMenu() {

    sidebar.classList.add("open");

    overlay.classList.add("show");

}


function closeSidebar() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openMenu
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


// =====================================================
// LOAD POSTS
// =====================================================

async function loadPosts() {

    try {

        const response =
            await fetch(
                POSTS_URL + "?t=" + Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Gagal mengambil posts.json"
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Format posts.json tidak valid"
            );

        }


        videos = data;

        filteredVideos = [...videos];

        currentPage = 1;

        renderVideos();

        loadPopular();


    } catch (error) {

        console.error(
            "Load posts error:",
            error
        );


        videoGrid.innerHTML =
            `
            <div class="empty-message">
                ❌ Gagal memuat video.
            </div>
            `;

    }

}


// =====================================================
// RENDER VIDEO
// =====================================================

function renderVideos() {

    if (!videoGrid) {
        return;
    }


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredVideos.length /
                POSTS_PER_PAGE
            )
        );


    if (currentPage > totalPages) {

        currentPage =
            totalPages;

    }


    const start =
        (currentPage - 1) *
        POSTS_PER_PAGE;


    const end =
        start +
        POSTS_PER_PAGE;


    const pageVideos =
        filteredVideos.slice(
            start,
            end
        );


    videoGrid.innerHTML = "";


    if (
        pageVideos.length === 0
    ) {

        videoGrid.innerHTML =
            `
            <div class="empty-message">
                Tidak ada video ditemukan.
            </div>
            `;

        updatePagination(
            0
        );

        return;
    }


    pageVideos.forEach(
        function(video) {

            const card =
                createVideoCard(
                    video
                );

            videoGrid.appendChild(
                card
            );

        }
    );


    updatePagination(
        totalPages
    );

}


// =====================================================
// VIDEO CARD
// =====================================================

function createVideoCard(video) {

    const card =
        document.createElement(
            "a"
        );


    card.className =
        "video-card";


    card.href =
        "/v/" +
        encodeURIComponent(
            video.slug
        ) +
        "/";


    // ================================================
    // THUMBNAIL
    // ================================================

    const thumbnail =
        document.createElement(
            "div"
        );


    thumbnail.className =
        "video-thumbnail";


    if (video.thumbnail) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            video.thumbnail;


        img.alt =
            video.title ||
            "Video";


        img.loading =
            "lazy";


        img.onerror =
            function() {

                img.style.display =
                    "none";

            };


        thumbnail.appendChild(
            img
        );

    } else {

        thumbnail.innerHTML =
            `
            <div class="thumbnail-placeholder">
                ▶
            </div>
            `;

    }


    // ================================================
    // INFO
    // ================================================

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "video-info";


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        video.title ||
        "Tanpa Judul";


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        video.description ||
        "";


    info.appendChild(
        title
    );


    if (video.description) {

        info.appendChild(
            description
        );

    }


    card.appendChild(
        thumbnail
    );


    card.appendChild(
        info
    );


    return card;

}


// =====================================================
// PAGINATION
// =====================================================

function updatePagination(
    totalPages
) {

    pageNumber.textContent =
        currentPage;


    pageInfo.textContent =
        "Halaman " +
        currentPage +
        " / " +
        totalPages;


    prevButton.disabled =
        currentPage <= 1;


    nextButton.disabled =
        currentPage >= totalPages;

}


prevButton.addEventListener(
    "click",
    function() {

        if (
            currentPage <= 1
        ) {
            return;
        }


        currentPage--;

        renderVideos();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


nextButton.addEventListener(
    "click",
    function() {

        const totalPages =
            Math.ceil(
                filteredVideos.length /
                POSTS_PER_PAGE
            );


        if (
            currentPage >=
            totalPages
        ) {
            return;
        }


        currentPage++;

        renderVideos();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// =====================================================
// SEARCH
// =====================================================

function doSearch() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!keyword) {

        filteredVideos =
            [...videos];

    } else {

        filteredVideos =
            videos.filter(
                function(video) {

                    const title =
                        String(
                            video.title || ""
                        ).toLowerCase();


                    const description =
                        String(
                            video.description || ""
                        ).toLowerCase();


                    return (
                        title.includes(
                            keyword
                        ) ||
                        description.includes(
                            keyword
                        )
                    );

                }
            );

    }


    currentPage = 1;

    renderVideos();

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        doSearch
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                doSearch();

            }

        }
    );

}


// =====================================================
// TOP 3 POPULER
// =====================================================

async function loadPopular() {

    if (!popularGrid) {
        return;
    }


    try {

        const response =
            await fetch(
                WORKER_URL +
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
            !Array.isArray(
                data.posts
            )
        ) {

            throw new Error(
                "Data popular tidak valid"
            );

        }


        popularGrid.innerHTML =
            "";


        const popular =
            data.posts.slice(
                0,
                3
            );


        if (
            popular.length === 0
        ) {

            popularGrid.innerHTML =
                `
                <div class="empty-message">
                    Belum ada video populer.
                </div>
                `;

            return;
        }


        popular.forEach(
            function(video, index) {

                const card =
                    document.createElement(
                        "a"
                    );


                card.className =
                    "popular-card";


                card.href =
                    "/v/" +
                    encodeURIComponent(
                        video.slug
                    ) +
                    "/";


                // ====================================
                // THUMB
                // ====================================

                const thumb =
                    document.createElement(
                        "div"
                    );


                thumb.className =
                    "popular-thumbnail";


                if (
                    video.thumbnail
                ) {

                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        video.thumbnail;


                    img.alt =
                        video.title ||
                        "Video";


                    img.loading =
                        "lazy";


                    thumb.appendChild(
                        img
                    );

                } else {

                    thumb.innerHTML =
                        `
                        <div class="thumbnail-placeholder">
                            ▶
                        </div>
                        `;

                }


                // ====================================
                // INFO
                // ====================================

                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "popular-info";


                const rank =
                    document.createElement(
                        "span"
                    );


                rank.className =
                    "popular-rank";


                rank.textContent =
                    "#" +
                    (index + 1);


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    video.title ||
                    "Tanpa Judul";


                const views =
                    document.createElement(
                        "p"
                    );


                views.className =
                    "popular-views";


                views.textContent =
                    Number(
                        video.views || 0
                    ).toLocaleString(
                        "id-ID"
                    ) +
                    " views";


                info.appendChild(
                    rank
                );


                info.appendChild(
                    title
                );


                info.appendChild(
                    views
                );


                card.appendChild(
                    thumb
                );


                card.appendChild(
                    info
                );


                popularGrid.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Popular error:",
            error
        );


        popularGrid.innerHTML =
            `
            <div class="empty-message">
                Gagal memuat video populer.
            </div>
            `;

    }

}


// =====================================================
// START
// =====================================================

loadPosts();
