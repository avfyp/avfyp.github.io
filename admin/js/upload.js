const WORKER_URL =
    "https://avfyp-upload.cntk-njay.workers.dev";


const form =
    document.getElementById("uploadForm");

const uploadButton =
    document.getElementById("uploadButton");

const statusBox =
    document.getElementById("status");

const resultBox =
    document.getElementById("result");

const titleInput =
    document.getElementById("title");

const slugInput =
    document.getElementById("slug");


/* =========================
   SLUG
========================= */

function makeSlug(text) {

    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);

}


titleInput.addEventListener("input", () => {

    if (!slugInput.value.trim()) {
        slugInput.value =
            makeSlug(titleInput.value);
    }

});


/* =========================
   STATUS
========================= */

function showStatus(message) {

    statusBox.textContent = message;

    statusBox.classList.remove("hidden");

}


function hideStatus() {

    statusBox.textContent = "";

    statusBox.classList.add("hidden");

}


/* =========================
   FORM
========================= */

form.addEventListener("submit", async event => {

    event.preventDefault();

    hideStatus();

    resultBox.innerHTML = "";
    resultBox.classList.add("hidden");


    const adminKey =
        document
            .getElementById("adminKey")
            .value
            .trim();

    const title =
        titleInput.value.trim();

    const slug =
        slugInput.value.trim() ||
        makeSlug(title);

    const description =
        document
            .getElementById("description")
            .value
            .trim();

    const thumbnail =
        document
            .getElementById("thumbnail")
            .value
            .trim();

    const server1 =
        document
            .getElementById("server1")
            .value
            .trim();

    const server2 =
        document
            .getElementById("server2")
            .value
            .trim();

    const popular =
        document
            .getElementById("popular")
            .checked;


    /* =========================
       VALIDATION
    ========================= */

    if (!adminKey) {

        showStatus(
            "❌ Password admin belum diisi."
        );

        return;
    }


    if (!title) {

        showStatus(
            "❌ Judul belum diisi."
        );

        return;
    }


    if (!slug) {

        showStatus(
            "❌ Slug tidak valid."
        );

        return;
    }


    if (!server1 && !server2) {

        showStatus(
            "❌ Minimal isi SERVER1 atau SERVER2."
        );

        return;
    }


    /* =========================
       PAYLOAD
    ========================= */

    const payload = {

        title,

        slug,

        description,

        thumbnail,

        server1,

        server2,

        popular

    };


    /* =========================
       UPLOAD
    ========================= */

    uploadButton.disabled = true;

    uploadButton.textContent =
        "⌛ Mengupload...";


    showStatus(
        "🕒 Menghubungi server AVFYP..."
    );


    try {

        const response = await fetch(
            WORKER_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " + adminKey
                },

                body:
                    JSON.stringify(payload)
            }
        );


        let data = {};

        try {

            data =
                await response.json();

        } catch {

            data = {};

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Upload gagal. HTTP ${response.status}`
            );

        }


        /* =========================
           SUCCESS
        ========================= */

        showStatus(
            "✅ Video berhasil ditambahkan!"
        );


        const videoUrl =
            data.url ||
            (
                "https://avfyp.github.io/v/" +
                slug +
                "/"
            );


        resultBox.innerHTML = "";

        const strong =
            document.createElement("strong");

        strong.textContent =
            "Posting berhasil dibuat.";

        const p =
            document.createElement("p");

        p.textContent =
            "URL video:";

        const link =
            document.createElement("a");

        link.href = videoUrl;

        link.target = "_blank";

        link.rel =
            "noopener noreferrer";

        link.textContent =
            videoUrl;

        resultBox.appendChild(strong);

        resultBox.appendChild(p);

        resultBox.appendChild(link);

        resultBox.classList.remove(
            "hidden"
        );


        /* =========================
           RESET
        ========================= */

        document
            .getElementById("adminKey")
            .value = "";

        titleInput.value = "";

        slugInput.value = "";

        document
            .getElementById("description")
            .value = "";

        document
            .getElementById("thumbnail")
            .value = "";

        document
            .getElementById("server1")
            .value = "";

        document
            .getElementById("server2")
            .value = "";

        document
            .getElementById("popular")
            .checked = false;


    } catch (error) {

        console.error(error);

        showStatus(
            "❌ " +
            (
                error.message ||
                "Terjadi kesalahan."
            )
        );


    } finally {

        uploadButton.disabled = false;

        uploadButton.textContent =
            "🚀 Upload Video";

    }

});
