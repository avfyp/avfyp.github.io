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

const createButton =
    document.getElementById("createButton");

const urlPreview =
    document.getElementById("urlPreview");

const result =
    document.getElementById("result");

const videoUrl =
    document.getElementById("videoUrl");

const copyUrl =
    document.getElementById("copyUrl");

const copyStatus =
    document.getElementById("copyStatus");


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


function updatePreview() {

    let slug =
        slugInput.value.trim();


    if (!slug) {

        slug =
            createSlug(
                titleInput.value
            );

    }


    if (slug) {

        urlPreview.textContent =
            "https://avfyp.github.io/v/" +
            slug;

    }
    else {

        urlPreview.textContent =
            "https://avfyp.github.io/v/judul-video";

    }

}


titleInput.addEventListener(
    "input",
    () => {

        if (!slugInput.value.trim()) {

            slugInput.value =
                createSlug(
                    titleInput.value
                );

        }

        updatePreview();

    }
);


slugInput.addEventListener(
    "input",
    () => {

        slugInput.value =
            createSlug(
                slugInput.value
            );

        updatePreview();

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


    if (match) {

        return (
            "https://drive.google.com/file/d/" +
            match[1] +
            "/preview"
        );

    }


    return url;

}


/* =========================
   BUAT VIDEO
========================= */

createButton.addEventListener(
    "click",
    () => {

        const title =
            titleInput.value.trim();

        let slug =
            slugInput.value.trim();

        const st =
            stInput.value.trim();

        const gd =
            normalizeDriveUrl(
                gdInput.value.trim()
            );

        const thumbnail =
            thumbnailInput.value.trim();


        if (!title) {

            alert(
                "Judul video wajib diisi."
            );

            return;

        }


        if (!slug) {

            slug =
                createSlug(title);

            slugInput.value =
                slug;

        }


        if (!st) {

            alert(
                "Link Streamtape / ST wajib diisi."
            );

            return;

        }


        /*
         * URL publik video
         */

        const url =
            "https://avfyp.github.io/v/" +
            slug;


        /*
         * Simpan data sementara
         * untuk halaman admin.
         */

        const postData = {

            title: title,

            slug: slug,

            st: st,

            gd: gd,

            thumbnail: thumbnail

        };


        localStorage.setItem(
            "avfyp_last_post",
            JSON.stringify(postData)
        );


        videoUrl.textContent =
            url;


        result.hidden =
            false;


        copyStatus.textContent =
            "";


        result.scrollIntoView({
            behavior: "smooth"
        });

    }
);


/* =========================
   COPY URL
========================= */

copyUrl.addEventListener(
    "click",
    async () => {

        const url =
            videoUrl.textContent.trim();


        if (!url) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                url
            );

            copyStatus.textContent =
                "✓ URL berhasil disalin";

        }
        catch {

            /*
             * Fallback untuk browser
             * yang tidak mengizinkan
             * clipboard API.
             */

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                url;

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();


            copyStatus.textContent =
                "✓ URL berhasil disalin";

        }


        setTimeout(
            () => {

                copyStatus.textContent =
                    "";

            },
            2500
        );

    }
);
