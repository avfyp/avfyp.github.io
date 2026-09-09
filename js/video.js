const WORKER_URL =
    "https://avfyp-upload.cntk-njay.workers.dev";


// =====================================================
// ELEMENT
// =====================================================

const videoPage =
    document.getElementById("videoPage");

const frame =
    document.getElementById("videoFrame");

const viewsNumber =
    document.getElementById("viewsNumber");

const commentForm =
    document.getElementById("commentForm");

const commentName =
    document.getElementById("commentName");

const commentText =
    document.getElementById("commentText");

const commentSubmit =
    document.getElementById("commentSubmit");

const commentList =
    document.getElementById("commentList");

const popularGrid =
    document.getElementById("popularGrid");


// =====================================================
// VIDEO DATA
// =====================================================

const slug =
    videoPage?.dataset.slug || "";

const servers = {

    st:
        videoPage?.dataset.st || "",

    gd:
        videoPage?.dataset.gd || "",

    vd:
        videoPage?.dataset.vd || ""

};


// =====================================================
// SERVER SWITCHER
// =====================================================

document
    .querySelectorAll(".server-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const server =
                    this.dataset.server;

                const url =
                    servers[server];


                if (!url) {
                    return;
                }


                if (!frame) {
                    return;
                }


                frame.src =
                    url;


                document
                    .querySelectorAll(
                        ".server-button"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                this.classList.add(
                    "active"
                );

            }
        );

    });


// =====================================================
// LOAD VIEWS
// =====================================================

async function loadViews() {

    if (
        !slug ||
        !viewsNumber
    ) {
        return;
    }


    try {

        const response =
            await fetch(

                WORKER_URL +
                "/api/views/" +
                encodeURIComponent(
                    slug
                ),

                {
                    method: "GET",

                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                "Gagal mengambil views"
            );
        }


        viewsNumber.textContent =
            Number(
                data.views || 0
            ).toLocaleString(
                "id-ID"
            );


    } catch (error) {

        console.error(
            "VIEWS ERROR:",
            error
        );


        viewsNumber.textContent =
            "0";
    }
}


// =====================================================
// ADD VIEW
// =====================================================

async function addView() {

    if (!slug) {
        return;
    }


    try {

        const response =
            await fetch(

                WORKER_URL +
                "/api/views/" +
                encodeURIComponent(
                    slug
                ),

                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                "Gagal menambah view"
            );
        }


        if (viewsNumber) {

            viewsNumber.textContent =
                Number(
                    data.views || 0
                ).toLocaleString(
                    "id-ID"
                );
        }


    } catch (error) {

        console.error(
            "ADD VIEW ERROR:",
            error
        );
    }
}


// =====================================================
// LOAD COMMENTS
// =====================================================

async function loadComments() {

    if (
        !slug ||
        !commentList
    ) {
        return;
    }


    commentList.innerHTML =
        '<div class="message">' +
        'Memuat komentar...' +
        '</div>';


    try {

        const response =
            await fetch(

                WORKER_URL +
                "/api/comments/" +
                encodeURIComponent(
                    slug
                ),

                {
                    method: "GET",

                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                "Gagal mengambil komentar"
            );
        }


        const comments =
            Array.isArray(
                data.comments
            )
                ? data.comments
                : [];


        commentList.innerHTML =
            "";


        if (!comments.length) {

            commentList.innerHTML =
                '<div class="message">' +
                'Belum ada komentar.' +
                '</div>';

            return;
        }


        comments.forEach(
            comment => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "comment-item";


                const name =
                    document.createElement(
                        "strong"
                    );

                name.textContent =
                    comment.name ||
                    "Anonim";


                const text =
                    document.createElement(
                        "p"
                    );

                text.textContent =
                    comment.comment ||
                    "";


                item.appendChild(
                    name
                );

                item.appendChild(
                    text
                );


                commentList.appendChild(
                    item
                );
            }
        );


    } catch (error) {

        console.error(
            "COMMENT LOAD ERROR:",
            error
        );


        commentList.innerHTML =
            '<div class="message">' +
            'Gagal memuat komentar.' +
            '</div>';
    }
}


// =====================================================
// SEND COMMENT
// =====================================================

if (commentForm) {

    commentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                commentName.value.trim();


            const comment =
                commentText.value.trim();


            if (!name) {

                alert(
                    "Nama wajib diisi."
                );

                commentName.focus();

                return;
            }


            if (!comment) {

                alert(
                    "Komentar wajib diisi."
                );

                commentText.focus();

                return;
            }


            commentSubmit.disabled =
                true;


            commentSubmit.textContent =
                "Mengirim...";


            try {

                const response =
                    await fetch(

                        WORKER_URL +
                        "/api/comments/" +
                        encodeURIComponent(
                            slug
                        ),

                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    name,
                                    comment
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.ok
                ) {

                    throw new Error(
                        data.error ||
                        "Gagal mengirim komentar"
                    );
                }


                commentName.value =
                    "";

                commentText.value =
                    "";


                await loadComments();


            } catch (error) {

                console.error(
                    "COMMENT SEND ERROR:",
                    error
                );


                alert(
                    error.message ||
                    "Gagal mengirim komentar."
                );


            } finally {

                commentSubmit.disabled =
                    false;

                commentSubmit.textContent =
                    "Kirim Komentar";
            }

        }
    );
}


// =====================================================
// POPULAR
// =====================================================

async function loadPopular() {

    if (!popularGrid) {
        return;
    }


    try {

        const response =
            await fetch(

                WORKER_URL +
                "/api/popular",

                {
                    method: "GET",

                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                "Gagal mengambil populer"
            );
        }


        const posts =
            Array.isArray(
                data.posts
            )
                ? data.posts
                : [];


        popularGrid.innerHTML =
            "";


        if (!posts.length) {

            popularGrid.innerHTML =
                '<div class="message">' +
                'Belum ada data populer.' +
                '</div>';

            return;
        }


        posts.forEach(
            item => {

                const post =
                    item.post;


                const card =
                    document.createElement(
                        "a"
                    );


                card.className =
                    "popular-card";


                card.href =
                    "/v/" +
                    encodeURIComponent(
                        post.slug
                    ) +
                    "/";


                if (post.thumbnail) {

                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        post.thumbnail;


                    image.alt =
                        post.title ||
                        "";


                    image.loading =
                        "lazy";


                    card.appendChild(
                        image
                    );
                }


                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "popular-content";


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    post.title ||
                    "";


                const views =
                    document.createElement(
                        "span"
                    );


                views.textContent =
                    "👁 " +
                    Number(
                        item.views || 0
                    ).toLocaleString(
                        "id-ID"
                    );


                content.appendChild(
                    title
                );


                content.appendChild(
                    views
                );


                card.appendChild(
                    content
                );


                popularGrid.appendChild(
                    card
                );
            }
        );


    } catch (error) {

        console.error(
            "POPULAR ERROR:",
            error
        );


        popularGrid.innerHTML =
            '<div class="message">' +
            'Gagal memuat populer.' +
            '</div>';
    }
}


// =====================================================
// MENU
// =====================================================

const menuButton =
    document.getElementById(
        "menuButton"
    );

const closeMenu =
    document.getElementById(
        "closeMenu"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const overlay =
    document.getElementById(
        "overlay"
    );


function openMenu() {

    sidebar?.classList.add(
        "active"
    );

    overlay?.classList.add(
        "active"
    );
}


function closeSidebar() {

    sidebar?.classList.remove(
        "active"
    );

    overlay?.classList.remove(
        "active"
    );
}


menuButton?.addEventListener(
    "click",
    openMenu
);


closeMenu?.addEventListener(
    "click",
    closeSidebar
);


overlay?.addEventListener(
    "click",
    closeSidebar
);


// =====================================================
// START
// =====================================================

loadViews();

addView();

loadComments();

loadPopular();


// refresh views
setInterval(
    loadViews,
    10000
);
