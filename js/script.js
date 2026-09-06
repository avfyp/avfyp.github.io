const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const videoCards = document.querySelectorAll(".video-card");


/* =========================
   SEARCH
========================= */

function searchVideos() {

    const keyword = searchInput.value
        .toLowerCase()
        .trim();


    videoCards.forEach(card => {

        const title = card
            .querySelector("h2")
            .textContent
            .toLowerCase();


        if (title.includes(keyword)) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

}


searchInput.addEventListener("input", searchVideos);

searchButton.addEventListener("click", searchVideos);


/* =========================
   HAMBURGER
========================= */

const menuButton = document.getElementById("menuButton");

menuButton.addEventListener("click", () => {

    console.log("Menu diklik");

});
