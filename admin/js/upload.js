const WORKER_URL =
    "https://avfyp-upload.cntk-njay.workers.dev";


// ==========================================
// ELEMENTS
// ==========================================

const adminKey =
    document.getElementById("adminKey");

const titleInput =
    document.getElementById("title");

const slugInput =
    document.getElementById("slug");

const descriptionInput =
    document.getElementById("description");

const thumbnailInput =
    document.getElementById("thumbnail");

const stInput =
    document.getElementById("st");

const gdInput =
    document.getElementById("gd");

const vdInput =
    document.getElementById("vd");

const popularInput =
    document.getElementById("popular");

const uploadButton =
    document.getElementById("uploadButton");

const statusBox =
    document.getElementById("status");


// ==========================================
// SLUG
// ==========================================

let slugManuallyEdited = false;


titleInput.addEventListener(
    "input",
    () => {

        if (slugManuallyEdited) {
            return;
        }

        slugInput.value =
            createSlug(titleInput.value);
    }
);


slugInput.addEventListener(
    "input",
    () => {

        slugManuallyEdited = true;

        slugInput.value =
            createSlug(slugInput.value);
    }
);


function createSlug(text) {

    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}


// ==========================================
// STATUS
// ==========================================

function showStatus(
    message,
    type = ""
) {

    statusBox.textContent =
        message;

    statusBox.className =
        "status show";

    if (type) {
        statusBox.classList.add(type);
    }
}


// ==========================================
// UPLOAD
// ==========================================

uploadButton.addEventListener(
    "click",
    uploadVideo
);


async function uploadVideo() {

    const key =
        adminKey.value.trim();

    const title =
        titleInput.value.trim();

    const slug =
        slugInput.value.trim();

    const description =
        descriptionInput.value.trim();

    const thumbnail =
        thumbnailInput.value.trim();

    const st =
        stInput.value.trim();

    const gd =
        gdInput.value.trim();

    const vd =
        vdInput.value.trim();

    const popular =
        popularInput.checked;


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!key) {

        showStatus(
            "Admin Key wajib diisi.",
            "error"
        );

        return;
    }


    if (!title) {

        showStatus(
            "Judul video wajib diisi.",
            "error"
        );

        return;
    }


    if (!slug) {

        showStatus(
            "Slug video wajib diisi.",
            "error"
        );

        return;
    }


    if (!st && !gd && !vd) {

        showStatus(
            "Minimal satu server video harus diisi.",
            "error"
        );

        return;
    }


    // --------------------------------------
    // BUTTON
    // --------------------------------------

    uploadButton.disabled = true;

    uploadButton.textContent =
        "⏳ Mengupload...";


    showStatus(
        "Mengirim data ke Worker..."
    );


    // --------------------------------------
    // REQUEST
    // --------------------------------------

    try {

        const response =
            await fetch(
                WORKER_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + key
                    },

                    body: JSON.stringify({

                        title: title,

                        description:
                            description,

                        slug: slug,

                        thumbnail:
                            thumbnail,

                        st: st,

                        gd: gd,

                        vd: vd,

                        popular: popular
                    })
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "Worker mengembalikan response yang tidak valid."
            );
        }


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                "Upload gagal."
            );
        }


        // ----------------------------------
        // SUCCESS
        // ----------------------------------

        let message =
            "✅ Upload berhasil!\n\n";


        if (data.url) {

            message +=
                "URL video:\n" +
                data.url +
                "\n\n";
        }


        message +=
            "Video page dan posts.json sudah diperbarui.";


        showStatus(
            message,
            "success"
        );


        // ----------------------------------
        // RESET
        // ----------------------------------

        titleInput.value = "";
        slugInput.value = "";

        descriptionInput.value = "";

        thumbnailInput.value = "";

        stInput.value = "";
        gdInput.value = "";
        vdInput.value = "";

        popularInput.checked = false;

        slugManuallyEdited = false;


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        showStatus(
            "❌ " + error.message,
            "error"
        );


    } finally {

        uploadButton.disabled =
            false;

        uploadButton.textContent =
            "🚀 Upload Video";
    }
}
