/* =====================================================
   AVFYP - MAIN SCRIPT
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {


    /* =================================================
       ELEMENT
       ================================================= */

    const menuButton =
        document.getElementById("menuButton");

    const closeMenu =
        document.getElementById("closeMenu");

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("overlay");


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


    /* =================================================
       DETECT PAGE
       ================================================= */

    const pathname =
        window.location.pathname;


    const isPopularPage =
        pathname === "/populer/" ||
        pathname === "/populer/index.html";


    /* =================================================
       API
       ================================================= */

    const POPULAR_API =
        "https://avfyp-upload.cntk-njay.workers.dev/api/popular";


    /* =================================================
       CONFIG
       ================================================= */

    const POSTS_PER_PAGE = 15;

    const HOME_POPULAR_LIMIT = 4;


    /* =================================================
       MENU
       ================================================= */

    function openMenu() {

        if (sidebar) {

            sidebar.classList.add(
                "active"
            );

        }


        if (overlay) {

            overlay.classList.add(
                "active"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    function closeSidebar() {

        if (sidebar) {

            sidebar.classList.remove(
                "active"
            );

        }


        if (overlay) {

            overlay.classList.remove(
                "active"
            );

        }


        document.body.style.overflow =
            "";

    }


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                openMenu();

            }
        );

    }


    if (closeMenu) {

        closeMenu.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                closeSidebar();

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                closeSidebar();

            }
        );

    }


    /* =================================================
       ESC
       ================================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                closeSidebar();

            }

        }
    );


    /* =================================================
       DATA
       ================================================= */

    let allPosts = [];

    let filteredPosts = [];

    let currentPage = 1;


    /* =================================================
       ESCAPE HTML
       ================================================= */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =================================================
       SLUG
       ================================================= */

    function getSlug(post) {

        if (
            post &&
            post.slug
        ) {

            return String(
                post.slug
            );

        }


        if (
            post &&
            post.id !== undefined
        ) {

            return String(
                post.id
            );

        }


        return "";

    }


    /* =================================================
       VIDEO URL
       ================================================= */

    function getVideoUrl(post) {

        const slug =
            getSlug(post);


        if (!slug) {

            return "#";

        }


        return (
            "/v/" +
            encodeURIComponent(
                slug
            ) +
            "/"
        );

    }


    /* =================================================
       THUMBNAIL
       ================================================= */

    function getThumbnail(post) {

        if (
            post &&
            post.thumbnail &&
            String(
                post.thumbnail
            ).trim() !== ""
        ) {

            return String(
                post.thumbnail
            );

        }


        return "";

    }


    /* =================================================
       GET VIEWS
       ================================================= */

    function getViews(post) {

        if (!post) {

            return 0;

        }


        const possibleViews = [

            post.views,

            post.video_views,

            post.view_count,

            post.total_views

        ];


        for (
            const value of possibleViews
        ) {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                const number =
                    Number(value);


                if (
                    Number.isFinite(
                        number
                    )
                ) {

                    return number;

                }

            }

        }


        return 0;

    }


    /* =================================================
       FORMAT VIEWS
       ================================================= */

    function formatViews(value) {

        const views =
            Number(value) || 0;


        if (
            views >= 1000000
        ) {

            return (

                (
                    views /
                    1000000
                )

                .toFixed(
                    views >= 10000000
                        ? 0
                        : 1
                )

                .replace(
                    ".0",
                    ""
                )

                + " jt tayangan"

            );

        }


        if (
            views >= 1000
        ) {

            return (

                (
                    views /
                    1000
                )

                .toFixed(
                    views >= 10000
                        ? 0
                        : 1
                )

                .replace(
                    ".0",
                    ""
                )

                + " rb tayangan"

            );

        }


        return (

            views.toLocaleString(
                "id-ID"
            )

            + " tayangan"

        );

    }


    /* =================================================
       CREATE NORMAL VIDEO CARD
       ================================================= */

    function createVideoCard(
        post,
        options = {}
    ) {

        const title =
            escapeHtml(
                post.title ||
                "Tanpa Judul"
            );


        const description =
            escapeHtml(
                post.description ||
                ""
            );


        const url =
            getVideoUrl(post);


        const thumbnail =
            getThumbnail(post);


        const showViews =
            options.showViews === true;


        const rank =
            options.rank;


        let thumbnailHtml =
            "";


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


        let extraHtml =
            "";


        if (
            rank !== undefined &&
            rank !== null
        ) {

            extraHtml = `

                <div class="popular-rank">
                    #${rank}
                </div>

            `;

        }


        if (showViews) {

            extraHtml += `

                <div class="popular-views">
                    ${formatViews(
                        getViews(post)
                    )}
                </div>

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

                    ${extraHtml}


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
       CREATE POPULAR HOME CARD
       ================================================= */

    function createPopularHomeCard(
        post,
        rank
    ) {

        const title =
            escapeHtml(
                post.title ||
                "Tanpa Judul"
            );


        const url =
            getVideoUrl(post);


        const thumbnail =
            getThumbnail(post);


        const views =
            formatViews(
                getViews(post)
            );


        let thumbnailHtml =
            "";


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

                <div class="popular-card-thumbnail">

                    ${thumbnailHtml}


                    <div class="popular-card-overlay">

                        <span
                            class="popular-card-rank"
                        >
                            #${rank}
                        </span>


                        <span
                            class="popular-card-play"
                        >
                            ▶
                        </span>

                    </div>

                </div>


                <div class="popular-card-info">

                    <div
                        class="popular-card-title"
                    >
                        ${title}
                    </div>


                    <div
                        class="popular-card-views"
                    >
                        👁 ${views}
                    </div>

                </div>

            </a>

        `;

    }


    /* =================================================
       LOADING
       ================================================= */

    function showLoading() {

        if (videoGrid) {

            videoGrid.innerHTML = `

                <div class="empty-message">

                    Memuat video...

                </div>

            `;

        }

    }


    /* =================================================
       ERROR
       ================================================= */

    function showError() {

        if (videoGrid) {

            videoGrid.innerHTML = `

                <div class="empty-message">

                    Gagal memuat video.

                    <br>

                    <small>
                        Silakan refresh halaman.
                    </small>

                </div>

            `;

        }


        if (popularGrid) {

            popularGrid.innerHTML =
                "";

        }


        updatePagination(
            0
        );

    }


    /* =================================================
       LOAD POSTS
       ================================================= */

    async function loadPosts() {

        showLoading();


        try {

            const response =
                await fetch(
                    "/posts.json?v=" +
                    Date.now(),
                    {
                        cache:
                            "no-store"
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            if (
                !Array.isArray(data)
            ) {

                throw new Error(
                    "posts.json bukan array"
                );

            }


            allPosts =
                data;


            filteredPosts =
                [...allPosts];


            currentPage =
                1;


            renderVideos();


            if (
                !isPopularPage
            ) {

                await loadHomePopular();

            }

        } catch (error) {

            console.error(
                "Gagal memuat posts.json:",
                error
            );


            showError();

        }

    }


    /* =================================================
       LOAD POPULAR PAGE
       ================================================= */

    async function loadPopularPage() {

        showLoading();


        try {

            const response =
                await fetch(

                    POPULAR_API +
                    "?limit=10000&t=" +
                    Date.now(),

                    {
                        cache:
                            "no-store"
                    }

                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Popular API HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            let posts =
                [];


            /* -----------------------------------------
               API ARRAY
               ----------------------------------------- */

            if (
                Array.isArray(data)
            ) {

                posts =
                    data;

            }


            /* -----------------------------------------
               API { posts: [] }
               ----------------------------------------- */

            else if (
                data &&
                Array.isArray(
                    data.posts
                )
            ) {

                posts =
                    data.posts;

            }


            /* -----------------------------------------
               API { data: [] }
               ----------------------------------------- */

            else if (
                data &&
                Array.isArray(
                    data.data
                )
            ) {

                posts =
                    data.data;

            }


            /* -----------------------------------------
               FALLBACK POSTS.JSON
               ----------------------------------------- */

            if (
                posts.length === 0
            ) {

                const fallbackResponse =
                    await fetch(

                        "/posts.json?v=" +
                        Date.now(),

                        {
                            cache:
                                "no-store"
                        }

                    );


                if (
                    fallbackResponse.ok
                ) {

                    const fallbackData =
                        await fallbackResponse.json();


                    if (
                        Array.isArray(
                            fallbackData
                        )
                    ) {

                        posts =
                            fallbackData.map(
                                post => ({

                                    ...post,

                                    views:
                                        getViews(
                                            post
                                        )

                                })
                            );

                    }

                }

            }


            /* -----------------------------------------
               SORT BY VIEWS
               ----------------------------------------- */

            posts.sort(
                (
                    a,
                    b
                ) => {

                    return (
                        getViews(b) -
                        getViews(a)
                    );

                }
            );


            allPosts =
                posts;


            filteredPosts =
                [...allPosts];


            currentPage =
                1;


            renderPopularPage();

        } catch (error) {

            console.error(
                "Gagal memuat video populer:",
                error
            );


            showError();

        }

    }


    /* =================================================
       LOAD HOME POPULAR TOP 4
       ================================================= */

    async function loadHomePopular() {

        if (!popularGrid) {

            return;

        }


        popularGrid.innerHTML = `

            <div class="empty-message">

                Memuat video populer...

            </div>

        `;


        try {

            const response =
                await fetch(

                    POPULAR_API +
                    "?limit=" +
                    HOME_POPULAR_LIMIT +
                    "&t=" +
                    Date.now(),

                    {
                        cache:
                            "no-store"
                    }

                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Popular API HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            let popularPosts =
                [];


            /* -----------------------------------------
               ARRAY
               ----------------------------------------- */

            if (
                Array.isArray(data)
            ) {

                popularPosts =
                    data;

            }


            /* -----------------------------------------
               { posts: [] }
               ----------------------------------------- */

            else if (
                data &&
                Array.isArray(
                    data.posts
                )
            ) {

                popularPosts =
                    data.posts;

            }


            /* -----------------------------------------
               { data: [] }
               ----------------------------------------- */

            else if (
                data &&
                Array.isArray(
                    data.data
                )
            ) {

                popularPosts =
                    data.data;

            }


            /* -----------------------------------------
               FALLBACK
               ----------------------------------------- */

            if (
                popularPosts.length === 0
            ) {

                popularPosts =
                    [...allPosts]

                        .sort(
                            (
                                a,
                                b
                            ) => {

                                return (
                                    getViews(b) -
                                    getViews(a)
                                );

                            }
                        )

                        .slice(
                            0,
                            HOME_POPULAR_LIMIT
                        );

            }


            /* -----------------------------------------
               SORT
               ----------------------------------------- */

            popularPosts =
                popularPosts

                    .sort(
                        (
                            a,
                            b
                        ) => {

                            return (
                                getViews(b) -
                                getViews(a)
                            );

                        }
                    )

                    .slice(
                        0,
                        HOME_POPULAR_LIMIT
                    );


            /* -----------------------------------------
               EMPTY
               ----------------------------------------- */

            if (
                popularPosts.length === 0
            ) {

                popularGrid.innerHTML = `

                    <div class="empty-message">

                        Belum ada video populer.

                    </div>

                `;

                return;

            }


            /* -----------------------------------------
               RENDER TOP 4
               ----------------------------------------- */

            popularGrid.innerHTML =
                popularPosts

                    .map(
                        (
                            post,
                            index
                        ) => {

                            return createPopularHomeCard(
                                post,
                                index + 1
                            );

                        }
                    )

                    .join("");


        } catch (error) {

            console.error(
                "Gagal memuat popular API:",
                error
            );


            /* -----------------------------------------
               FINAL FALLBACK
               ----------------------------------------- */

            const fallback =
                [...allPosts]

                    .sort(
                        (
                            a,
                            b
                        ) => {

                            return (
                                getViews(b) -
                                getViews(a)
                            );

                        }
                    )

                    .slice(
                        0,
                        HOME_POPULAR_LIMIT
                    );


            if (
                fallback.length > 0
            ) {

                popularGrid.innerHTML =
                    fallback

                        .map(
                            (
                                post,
                                index
                            ) => {

                                return createPopularHomeCard(
                                    post,
                                    index + 1
                                );

                            }
                        )

                        .join("");

            } else {

                popularGrid.innerHTML = `

                    <div class="empty-message">

                        Belum ada video populer.

                    </div>

                `;

            }

        }

    }


    /* =================================================
       RENDER HOME VIDEOS
       ================================================= */

    function renderVideos() {

        if (!videoGrid) {

            return;

        }


        if (
            filteredPosts.length === 0
        ) {

            videoGrid.innerHTML = `

                <div class="empty-message">

                    Video tidak ditemukan.

                </div>

            `;


            updatePagination(
                0
            );

            return;

        }


        const totalPages =
            Math.ceil(

                filteredPosts.length /
                POSTS_PER_PAGE

            );


        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;

        }


        if (
            currentPage < 1
        ) {

            currentPage =
                1;

        }


        const startIndex =
            (
                currentPage - 1
            ) *
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

                .map(
                    post =>
                        createVideoCard(
                            post
                        )
                )

                .join("");


        updatePagination(
            totalPages
        );

    }


    /* =================================================
       RENDER POPULAR PAGE
       ================================================= */

    function renderPopularPage() {

        if (!videoGrid) {

            return;

        }


        if (
            filteredPosts.length === 0
        ) {

            videoGrid.innerHTML = `

                <div class="empty-message">

                    Video populer tidak ditemukan.

                </div>

            `;


            updatePagination(
                0
            );

            return;

        }


        const totalPages =
            Math.ceil(

                filteredPosts.length /
                POSTS_PER_PAGE

            );


        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;

        }


        if (
            currentPage < 1
        ) {

            currentPage =
                1;

        }


        const startIndex =
            (
                currentPage - 1
            ) *
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

                .map(
                    (
                        post,
                        index
                    ) => {

                        const globalRank =
                            startIndex +
                            index +
                            1;


                        return createVideoCard(

                            post,

                            {
                                rank:
                                    globalRank,

                                showViews:
                                    true
                            }

                        );

                    }
                )

                .join("");


        updatePagination(
            totalPages
        );

    }


    /* =================================================
       PAGINATION
       ================================================= */

    function updatePagination(
        totalPages
    ) {

        if (pageNumber) {

            pageNumber.textContent =

                totalPages > 0

                    ? currentPage

                    : "0";

        }


        if (pageInfo) {

            if (
                totalPages > 0
            ) {

                pageInfo.textContent =
                    "Halaman " +
                    currentPage +
                    " / " +
                    totalPages;

            } else {

                pageInfo.textContent =
                    "Tidak ada video";

            }

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
       SCROLL TO VIDEO
       ================================================= */

    function scrollToVideos() {

        const section =
            videoGrid?.closest(
                "section"
            );


        if (!section) {

            return;

        }


        const headerHeight =
            70;


        const top =

            section
                .getBoundingClientRect()
                .top +

            window.scrollY -

            headerHeight;


        window.scrollTo({

            top:
                Math.max(
                    0,
                    top
                ),

            behavior:
                "smooth"

        });

    }


    /* =================================================
       PREVIOUS
       ================================================= */

    if (prevButton) {

        prevButton.addEventListener(
            "click",
            () => {

                if (
                    currentPage > 1
                ) {

                    currentPage--;


                    if (
                        isPopularPage
                    ) {

                        renderPopularPage();

                    } else {

                        renderVideos();

                    }


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


                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;


                    if (
                        isPopularPage
                    ) {

                        renderPopularPage();

                    } else {

                        renderVideos();

                    }


                    scrollToVideos();

                }

            }
        );

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

                allPosts.filter(
                    (post) => {

                        const title =

                            String(
                                post.title ||
                                ""
                            )
                            .toLowerCase();


                        const description =

                            String(
                                post.description ||
                                ""
                            )
                            .toLowerCase();


                        const slug =

                            String(
                                post.slug ||
                                ""
                            )
                            .toLowerCase();


                        return (

                            title.includes(
                                keyword
                            ) ||

                            description.includes(
                                keyword
                            ) ||

                            slug.includes(
                                keyword
                            )

                        );

                    }
                );

        }


        currentPage =
            1;


        if (
            isPopularPage
        ) {

            renderPopularPage();

        } else {

            renderVideos();

        }

    }


    /* =================================================
       SEARCH BUTTON
       ================================================= */

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    /* =================================================
       SEARCH ENTER
       ================================================= */

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performSearch();

                }

            }
        );


        /* ---------------------------------------------
           RESET SEARCH
           --------------------------------------------- */

        searchInput.addEventListener(
            "input",
            () => {

                if (
                    searchInput.value
                        .trim() === ""
                ) {

                    filteredPosts =
                        [...allPosts];


                    currentPage =
                        1;


                    if (
                        isPopularPage
                    ) {

                        renderPopularPage();

                    } else {

                        renderVideos();

                    }

                }

            }
        );

    }


    /* =================================================
       SIDEBAR LINKS
       ================================================= */

    if (sidebar) {

        const sidebarLinks =
            sidebar.querySelectorAll(
                "a"
            );


        sidebarLinks.forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    () => {

                        closeSidebar();

                    }
                );

            }
        );

    }


    /* =================================================
       START
       ================================================= */

    if (
        isPopularPage
    ) {

        loadPopularPage();

    } else {

        loadPosts();

    }

});
