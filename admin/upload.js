const WORKER_URL =
    "https://avfyp-upload.cntk-njay.workers.dev/";

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
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

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
// UPLOAD
// ==============================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideStatus();

    resultBox.classList.add("hidden");
    resultBox.innerHTML = "";

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

    const popular =
        document.getElementById("popular").checked;


    if (!adminKey) {
        showStatus("❌ Password admin belum diisi.");
        return;
    }

    if (!title) {
        showStatus("❌ Judul belum diisi.");
        return;
    }

    if (!st && !gd) {
        showStatus("❌ Minimal isi satu server video.");
        return;
    }


    const payload = {
        title,
        slug,
        description,
        thumbnail,
        st,
        gd,
        popular
    };


    uploadButton.disabled = true;
    uploadButton.textContent = "⌛ Mengupload...";

    showStatus("🕒 Menghubungi server AVFYP...");


    try {

        const response = await fetch(WORKER_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + adminKey
            },

            body: JSON.stringify(payload)

        });


        let data;

        try {
            data = await response.json();
        } catch {
            data = {};
        }


        if (!response.ok) {

            const message =
                data.error ||
                `Upload gagal. HTTP ${response.status}`;

            throw new Error(message);
        }


        showStatus("✅ Video berhasil ditambahkan!");


        const videoUrl =
            "https://avfyp.github.io/v/" + slug + "/";


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


        // Password tidak disimpan.
        document.getElementById("adminKey").value = "";

        // Reset form selain password.
        titleInput.value = "";
        slugInput.value = "";
        document.getElementById("description").value = "";
        document.getElementById("thumbnail").value = "";
        document.getElementById("st").value = "";
        document.getElementById("gd").value = "";
        document.getElementById("popular").checked = false;


    } catch (error) {

        console.error(error);

        showStatus(
            "❌ " + (error.message || "Terjadi kesalahan.")
        );

    } finally {

        uploadButton.disabled = false;
        uploadButton.textContent = "🚀 Upload Video";

    }

});