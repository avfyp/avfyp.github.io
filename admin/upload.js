const titleInput =
    document.getElementById("title");

const slugInput =
    document.getElementById("slug");

const stInput =
    document.getElementById("st");

const gdInput =
    document.getElementById("gd");

const thumbnailInput =
    document.getElementById("thumbnail");

const uploadButton =
    document.getElementById("uploadButton");

const urlPreview =
    document.getElementById("urlPreview");

const thumbnailStatus =
    document.getElementById(
        "thumbnailStatus"
    );

const result =
    document.getElementById("result");

const filePath =
    document.getElementById("filePath");

const downloadAgain =
    document.getElementById("downloadAgain");


let generatedHTML = "";



/* =========================
   SLUG
========================= */

function createSlug(text) {

    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

}



function updateSlug() {

    if (!slugInput.value.trim()) {

        slugInput.value =
            createSlug(
                titleInput.value
            );

    }


    const slug =
        slugInput.value.trim();


    urlPreview.textContent =
        slug
            ? `https://avfyp.github.io/v/${slug}`
            : "https://avfyp.github.io/v/judul-video";

}


titleInput.addEventListener(
    "input",
    updateSlug
);


slugInput.addEventListener(
    "input",
    () => {

        slugInput.value =
            createSlug(
                slugInput.value
            );

        updateSlug();

    }
);



/* =========================
   DRIVE
========================= */

function normalizeDriveUrl(url) {

    if (!url) {
        return "";
    }


    const match =
        url.match(
            /drive\.google\.com\/file\/d\/([^/]+)/
        );


    if (!match) {
        return url;
    }


    return (
        "https://drive.google.com/file/d/" +
        match[1] +
        "/preview"
    );

}



/* =========================
   STREAMTAPE THUMBNAIL
========================= */

function getStreamtapeThumbnail(url) {

    /*
       Tidak semua URL Streamtape
       menyediakan thumbnail yang
       bisa diambil dari browser.

       Fungsi ini hanya mencoba
       pola thumbnail yang tersedia.
    */


    if (!url) {
        return "";
    }


    try {

        const parsed =
            new URL(url);


        const parts =
            parsed.pathname
                .split("/")
                .filter(Boolean);


        if (parts.length === 0) {
            return "";
        }


        const id =
            parts.find(
                part =>
                    /^[a-zA-Z0-9]+$/.test(
                        part
                    )
            );


        if (!id) {
            return "";
        }


        /*
           Jangan menganggap endpoint
           thumbnail tertentu selalu aktif.
           Jika gagal, halaman video
           akan menggunakan fallback.
        */

        return "";

    }
    catch {

        return "";

    }

}



/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



/* =========================
   CREATE HTML
========================= */

function createVideoHTML(data) {

    const st =
        escapeHTML(
            data.st
        );

    const gd =
        escapeHTML(
            data.gd
        );

    const title =
        escapeHTML(
            data.title
        );

    const thumbnail =
        escapeHTML(
            data.thumbnail
        );


    const gdButton =
        data.gd
            ? `
                <button
                    class="server-button"
                    data-server="gd"
                >
                    GD
                </button>
            `
            : "";


    return `<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>${title} - AVFYP</title>

    <link
        rel="stylesheet"
        href="../../css/video.css"
    >

</head>


<body>

<header class="video-header">

    <a
        href="/"
        class="logo"
    >
        AVFYP
    </a>

    <a
        href="/"
        class="home-button"
    >
        ← Beranda
    </a>

</header>


<main class="video-container">

    <h1>${title}</h1>


    <div class="player-wrapper">

        <iframe
            id="videoPlayer"
            src="${st}"
            allowfullscreen
            allow="autoplay; fullscreen"
            loading="lazy"
        ></iframe>

    </div>


    <div class="server-switcher">

        <button
            class="server-button active"
            data-server="st"
        >
            ST
        </button>

        ${gdButton}

    </div>


    <div
        class="thumbnail-preview"
        ${thumbnail
            ? `style="background-image:url('${thumbnail}')"`
            : ""
        }
    ></div>


</main>


<script>

const servers = {
    st: ${JSON.stringify(data.st)},
    gd: ${JSON.stringify(data.gd)}
};

const player =
    document.getElementById("videoPlayer");


document
    .querySelectorAll(".server-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const server =
                    button.dataset.server;


                if (!servers[server]) {
                    return;
                }


                player.src =
                    servers[server];


                document
                    .querySelectorAll(
                        ".server-button"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );

            }
        );

    });

</script>


</body>
</html>`;

}



/* =========================
   DOWNLOAD
========================= */

function downloadHTML(
    html,
    slug
) {

    const blob =
        new Blob(
            [html],
            {
                type:
                    "text/html"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        "index.html";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}



/* =========================
   UPLOAD / GENERATE
========================= */

uploadButton.addEventListener(
    "click",
    () => {

        const title =
            titleInput.value.trim();

        const slug =
            slugInput.value.trim();

        const st =
            stInput.value.trim();

        const gd =
            normalizeDriveUrl(
                gdInput.value.trim()
            );

        let thumbnail =
            thumbnailInput.value.trim();


        if (!title) {

            alert(
                "Judul video wajib diisi."
            );

            return;

        }


        if (!slug) {

            alert(
                "Slug wajib diisi."
            );

            return;

        }


        if (!st) {

            alert(
                "Link Streamtape / ST wajib diisi."
            );

            return;

        }


        /*
           Coba thumbnail otomatis.
        */

        if (!thumbnail) {

            thumbnail =
                getStreamtapeThumbnail(
                    st
                );

        }


        if (thumbnail) {

            thumbnailStatus.textContent =
                "Thumbnail otomatis dari ST";

        }
        else {

            thumbnailStatus.textContent =
                "Thumbnail ST tidak tersedia — menggunakan player ST";

        }


        const data = {

            title:
                title,

            slug:
                slug,

            st:
                st,

            gd:
                gd,

            thumbnail:
                thumbnail

        };


        generatedHTML =
            createVideoHTML(
                data
            );


        /*
           Download otomatis.
        */

        downloadHTML(
            generatedHTML,
            slug
        );


        filePath.textContent =
            `v/${slug}/index.html`;


        result.hidden =
            false;


        window.scrollTo({
            top:
                document.body.scrollHeight,

            behavior:
                "smooth"
        });

    }
);



/* =========================
   DOWNLOAD LAGI
========================= */

downloadAgain.addEventListener(
    "click",
    () => {

        if (!generatedHTML) {
            return;
        }


        const slug =
            slugInput.value.trim();


        downloadHTML(
            generatedHTML,
            slug
        );

    }
);
