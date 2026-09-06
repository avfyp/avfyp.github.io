/* ==================================================
   DATA VIDEO
================================================== */

const videos = [

    {
        id: 1,
        title: "Video Pertama",
        description: "Deskripsi video pertama"
    },

    {
        id: 2,
        title: "Video Kedua",
        description: "Deskripsi video kedua"
    },

    {
        id: 3,
        title: "Video Ketiga",
        description: "Deskripsi video ketiga"
    },

    {
        id: 4,
        title: "Video Keempat",
        description: "Deskripsi video keempat"
    },

    {
        id: 5,
        title: "Video Kelima",
        description: "Deskripsi video kelima"
    },

    {
        id: 6,
        title: "Video Keenam",
        description: "Deskripsi video keenam"
    },

    {
        id: 7,
        title: "Video Ketujuh",
        description: "Deskripsi video ketujuh"
    },

    {
        id: 8,
        title: "Video Kedelapan",
        description: "Deskripsi video kedelapan"
    },

    {
        id: 9,
        title: "Video Kesembilan",
        description: "Deskripsi video kesembilan"
    },

    {
        id: 10,
        title: "Video Kesepuluh",
        description: "Deskripsi video kesepuluh"
    },

    {
        id: 11,
        title: "Video Kesebelas",
        description: "Deskripsi video kesebelas"
    },

    {
        id: 12,
        title: "Video Keduabelas",
        description: "Deskripsi video keduabelas"
    },

    {
        id: 13,
        title: "Video Ketigabelas",
        description: "Deskripsi video ketigabelas"
    },

    {
        id: 14,
        title: "Video Keempatbelas",
        description: "Deskripsi video keempatbelas"
    },

    {
        id: 15,
        title: "Video Kelimabelas",
        description: "Deskripsi video kelimabelas"
    },

    {
        id: 16,
        title: "Video Keenambelas",
        description: "Deskripsi video keenambelas"
    },

    {
        id: 17,
        title: "Video Ketujuhbelas",
        description: "Deskripsi video ketujuhbelas"
    },

    {
        id: 18,
        title: "Video Kedelapanbelas",
        description: "Deskripsi video kedelapanbelas"
    },

    {
        id: 19,
        title: "Video Kesembilanbelas",
        description: "Deskripsi video kesembilanbelas"
    },

    {
        id: 20,
        title: "Video Keduapuluh",
        description: "Deskripsi video keduapuluh"
    }

];


/* ==================================================
   SETTINGS
================================================== */

const POSTS_PER_PAGE = 15;

let currentPage = 1;

let filteredVideos = [...videos];


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


        card.innerHTML = `

            <div class="thumbnail">
                VIDEO
            </div>

            <div class="video-info">

                <h3>
                    ${video.title}
                </h3>

                <p>
                    ${video.description}
                </p>

            </div>

        `;


        videoGrid.appendChild(card);

    });


    updatePagination(totalPages);

}


/* ==================================================
   PAGINATION
================================================== */

function updatePagination(totalPages) {

    pageNumber.textContent =
        currentPage;


    pageInfo.textContent =
        `Halaman ${currentPage} dari ${totalPages || 1}`;


    prevButton.disabled =
        currentPage <= 1;


    nextButton.disabled =
        currentPage >= totalPages;

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

            return (
                video.title
                    .toLowerCase()
                    .includes(keyword)

                ||

                video.description
                    .toLowerCase()
                    .includes(keyword)
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

/*
   Untuk sementara Top 3 menggunakan
   3 postingan pilihan secara manual.

   Nanti saat sistem postingan sudah jadi,
   bagian ini bisa mengambil data dari posts.json.
*/

function renderPopular() {

    const popular =
        videos.slice(0, 3);


    popularGrid.innerHTML = "";


    popular.forEach((video, index) => {

        const card =
            document.createElement("article");


        card.className =
            "popular-card";


        card.innerHTML = `

            <div class="popular-number">
                ${index + 1}
            </div>

            <div class="popular-thumbnail">
                VIDEO
            </div>

            <div class="popular-info">

                <h3>
                    ${video.title}
                </h3>

                <span>
                    Postingan populer
                </span>

            </div>

        `;


        popularGrid.appendChild(card);

    });

}


/* ==================================================
   INITIALIZE
================================================== */

renderPopular();

renderVideos();
