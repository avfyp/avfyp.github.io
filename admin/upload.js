const WORKER_URL = "https://avfyp-upload.cntk-njay.workers.dev/";

const form = document.getElementById("uploadForm");
const uploadButton = document.getElementById("uploadButton");

const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");

const titleInput = document.getElementById("title");
const slugInput = document.getElementById("slug");


// ==============================
// AUTO SLUG
// ==============================

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


// Auto isi slug dari judul
titleInput.addEventListener("input", () => {

    if (!slugInput.value.trim()) {
        slugInput.value = makeSlug(titleInput.value);
    }

});


// ==============================
// STATUS
// ==============================

function showStatus(message) {

    statusBox.textContent = message;

    statusBox.classList.remove("hidden");

}


function hideStatus() {

    statusBox.classList.add("hidden");

}


// ==============================
// RESULT
// ==============================

function showResult(slug) {

    const videoUrl =
        "https://avfyp.github.io/v/" + encodeURIComponent(slug) + "/";

    resultBox.innerHTML = `
        <strong>Posting berhasil dibuat.</strong>

        <p>
            URL video:
        </p>

        <p>
            <a
                href="${videoUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >
                ${videoUrl}
            </a>
        </p>
    `;

    resultBox.classList.remove("hidden");

}


// ==============================
// UPLOAD
// ==============================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideStatus();

    resultBox.classList.add("hidden");
    resultBox.innerHTML = "";


    // ==========================
    // AMBIL DATA FORM
    // ==========================

    const adminKey =
        document.getElementById("adminKey").value.trim();

    const title =
        titleInput.value.trim();

    const slug =
        slugInput.value.trim() || makeSlug(title);

    const description =
        document.getElementById("description").value.trim();

    const thumbnail =
        document.getElementById("thumbnail").value.trim();

    const st =
        document.getElementById("st").value.trim();

    const gd =
        document.getElementById("gd").value.trim();

    const vd =
        document.getElementById("vd").value.trim();

    const popular =
        document.getElementById("popular").checked;


    // ==========================
    // VALIDASI
    // ==========================

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


    // Minimal satu server
    if (!st && !gd && !vd) {

        showStatus(
            "❌ Minimal isi satu server video."
        );

        return;
    }


    // ==========================
    // PAYLOAD
    // ==========================

    const payload = {

        title: title,

        slug: slug,

        description: description,

        thumbnail: thumbnail,

        st: st,

        gd: gd,

        vd: vd,

        popular: popular

    };


    console.log("Upload payload:", {
        ...payload,
        // Jangan tampilkan password
    });


    // ==========================
    // BUTTON LOADING
    // ==========================

    uploadButton.disabled = true;

    uploadButton.textContent =
        "⌛ Mengupload...";


    showStatus(
        "🕒 Menghubungi server AVFYP..."
    );


    // ==========================
    // REQUEST
    // ==========================

    try {

        const response = await fetch(
            WORKER_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        "Bearer " + adminKey
                },

                body: JSON.stringify(payload)
            }
        );


        // ======================
        // RESPONSE
        // ======================

        let data = {};

        try {

            data = await response.json();

        } catch {

            data = {};

        }


        // ======================
        // ERROR
        // ======================

        if (!response.ok) {

            const message =
                data.error ||
                `Upload gagal. HTTP ${response.status}`;

            throw new Error(message);

        }


        // ======================
        // BERHASIL
        // ======================

        showStatus(
            "✅ Video berhasil dipublish!"
        );


        showResult(
            data.slug || slug
        );


        // ======================
        // RESET FORM
        // ======================

        document.getElementById(
            "adminKey"
        ).value = "";

        titleInput.value = "";

        slugInput.value = "";

        document.getElementById(
            "description"
        ).value = "";

        document.getElementById(
            "thumbnail"
        ).value = "";

        document.getElementById(
            "st"
        ).value = "";

        document.getElementById(
            "gd"
        ).value = "";

        document.getElementById(
            "vd"
        ).value = "";

        document.getElementById(
            "popular"
        ).checked = false;


    } catch (error) {

        console.error(
            "AVFYP Upload Error:",
            error
        );


        showStatus(
            "❌ " +
            (
                error.message ||
                "Terjadi kesalahan saat upload."
            )
        );


    } finally {

        uploadButton.disabled = false;

        uploadButton.textContent =
            "🚀 Upload Video";

    }

});
