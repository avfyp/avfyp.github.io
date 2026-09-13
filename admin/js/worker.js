const OWNER = "avfyp";
const REPO = "avfyp.github.io";
const BRANCH = "main";

const ALLOWED_ORIGIN =
    "https://avfyp.github.io";

const SITE_URL =
    "https://avfyp.github.io";

const WORKER_URL =
    "https://avfyp-upload.cntk-njay.workers.dev";


/* =========================================================
   CORS
========================================================= */

function corsHeaders(origin) {

    const allowed =
        origin === ALLOWED_ORIGIN;

    return {
        "Access-Control-Allow-Origin":
            allowed
                ? ALLOWED_ORIGIN
                : "null",

        "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type, Authorization",

        "Vary":
            "Origin"
    };
}


function jsonResponse(
    data,
    status = 200,
    origin = ""
) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "no-store, no-cache, must-revalidate, proxy-revalidate",

                "Pragma":
                    "no-cache",

                "Expires":
                    "0",

                ...corsHeaders(origin)
            }
        }
    );
}


/* =========================================================
   SLUG
========================================================= */

function cleanSlug(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DRIVE URL
========================================================= */

function normalizeDrive(url) {

    const value =
        String(url || "").trim();

    if (!value) {
        return "";
    }

    const match =
        value.match(
            /drive\.google\.com\/file\/d\/([^/]+)/
        );

    if (match) {

        return (
            "https://drive.google.com/file/d/" +
            match[1] +
            "/preview"
        );
    }

    return value;
}


/* =========================================================
   BASE64
========================================================= */
function encodeBase64(text) {

    const bytes =
        new TextEncoder().encode(text);

    let binary = "";

    const chunkSize =
        0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        binary +=
            String.fromCharCode(
                ...bytes.subarray(
                    i,
                    i + chunkSize
                )
            );
    }

    return btoa(binary);
}


function decodeBase64(base64) {

    const binary =
        atob(
            String(base64 || "")
                .replace(/\s/g, "")
        );

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);
    }

    return new TextDecoder()
        .decode(bytes);
}


/* =========================================================
   GITHUB API
========================================================= */

async function githubRequest(
    path,
    env,
    options = {}
) {

    const url =
        "https://api.github.com/repos/" +
        OWNER +
        "/" +
        REPO +
        "/contents/" +
        path;

    return fetch(
        url,
        {
            ...options,

            headers: {
                "Accept":
                    "application/vnd.github+json",

                "Authorization":
                    "Bearer " +
                    env.GITHUB_TOKEN,

                "X-GitHub-Api-Version":
                    "2022-11-28",

                "User-Agent":
                    "AVFYP-Upload-Worker",

                ...(options.headers || {})
            }
        }
    );
}


async function getGithubFile(
    path,
    env
) {

    const response =
        await githubRequest(
            path,
            env,
            {
                method: "GET"
            }
        );

    if (
        response.status ===
        404
    ) {
        return null;
    }

    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            "GitHub GET " +
            path +
            " gagal: " +
            response.status +
            " " +
            text
        );
    }

    const data =
        await response.json();

    return {
        content:
            decodeBase64(
                data.content
            ),

        sha:
            data.sha
    };
}


async function putGithubFile(
    path,
    content,
    message,
    env,
    sha = null
) {

    const body = {
        message,

        content:
            encodeBase64(
                content
            ),

        branch:
            BRANCH
    };

    if (sha) {
        body.sha = sha;
    }

    const response =
        await githubRequest(
            path,
            env,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(body)
            }
        );

    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            "GitHub PUT " +
            path +
            " gagal: " +
            response.status +
            " " +
            text
        );
    }

    return response.json();
}


/* =========================================================
   D1 - VIEWS
========================================================= */

async function ensureViewRow(
    env,
    slug
) {

    await env.DB.prepare(`
        INSERT OR IGNORE INTO video_views
        (slug, views)
        VALUES (?, 0)
    `)
        .bind(slug)
        .run();
}


async function getViews(
    env,
    slug
) {

    await ensureViewRow(
        env,
        slug
    );

    const row =
        await env.DB.prepare(`
            SELECT views
            FROM video_views
            WHERE slug = ?
        `)
        .bind(slug)
        .first();

    return Number(
        row?.views || 0
    );
}


async function addView(
    env,
    slug
) {

    await env.DB.prepare(`
        INSERT INTO video_views
        (slug, views)
        VALUES (?, 1)

        ON CONFLICT(slug)
        DO UPDATE SET
            views = views + 1
    `)
        .bind(slug)
        .run();

    return getViews(
        env,
        slug
    );
}


/* =========================================================
   POPULAR
========================================================= */

async function getPopularPosts(
    env,
    requestedLimit = 3
) {

    let limit =
        Number(requestedLimit);

    if (
        !Number.isFinite(limit)
    ) {
        limit = 3;
    }

    limit =
        Math.max(
            1,
            Math.min(
                10,
                Math.floor(limit)
            )
        );

    const file =
        await getGithubFile(
            "posts.json",
            env
        );

    let posts = [];

    if (file) {

        try {

            posts =
                JSON.parse(
                    file.content
                );

        } catch {

            posts = [];
        }
    }

    if (
        !Array.isArray(posts)
    ) {
        posts = [];
    }

    const postMap =
        new Map(
            posts.map(
                post => [
                    post.slug,
                    post
                ]
            )
        );

    const result =
        await env.DB.prepare(`
            SELECT slug, views
            FROM video_views
            ORDER BY views DESC, slug ASC
            LIMIT ?
        `)
        .bind(limit)
        .all();

    const rows =
        result.results || [];

    const popular =
        rows
            .map(row => {

                const post =
                    postMap.get(
                        row.slug
                    );

                if (!post) {
                    return null;
                }

                return {
                    id:
                        post.id,

                    title:
                        post.title || "",

                    slug:
                        post.slug,

                    thumbnail:
                        post.thumbnail || "",

                    views:
                        Number(
                            row.views || 0
                        )
                };
            })
            .filter(Boolean);

    if (
        popular.length <
        limit
    ) {

        const used =
            new Set(
                popular.map(
                    post =>
                        post.slug
                )
            );

        for (
            const post of posts
        ) {

            if (
                popular.length >=
                limit
            ) {
                break;
            }

            if (
                used.has(
                    post.slug
                )
            ) {
                continue;
            }

            const views =
                await getViews(
                    env,
                    post.slug
                );

            popular.push({

                id:
                    post.id,

                title:
                    post.title || "",

                slug:
                    post.slug,

                thumbnail:
                    post.thumbnail || "",

                views
            });

            used.add(
                post.slug
            );
        }
    }

    popular.sort(
        (a, b) =>
            Number(b.views || 0) -
            Number(a.views || 0)
    );

    return popular.slice(
        0,
        limit
    );
}


/* =========================================================
   VIDEO PAGE GENERATOR
========================================================= */

function createVideoPage(post) {

    const title =
        escapeHtml(
            post.title
        );

    const description =
        escapeHtml(
            post.description
        );


    const server1 =
        escapeHtml(
            normalizeDrive(
                post.servers?.server1 ||
                post.servers?.st ||
                ""
            )
        );

    const server2 =
        escapeHtml(
            normalizeDrive(
                post.servers?.server2 ||
                post.servers?.gd ||
                post.servers?.vd ||
                ""
            )
        );


    const firstServer =
        server1 ||
        server2;


    let serverButtons = "";


    if (server1) {

        serverButtons +=
            '<button type="button" ' +
            'class="server-btn active" ' +
            'data-url="' +
            server1 +
            '">' +
            'SERVER1' +
            '</button>';
    }


    if (server2) {

        serverButtons +=
            '<button type="button" ' +
            'class="server-btn ' +
            (
                server1
                    ? ""
                    : "active"
            ) +
            '" data-url="' +
            server2 +
            '">' +
            'SERVER2' +
            '</button>';
    }


    const player =
        firstServer

            ? (
                '<iframe ' +
                'id="videoFrame" ' +
                'src="' +
                firstServer +
                '" ' +
                'allowfullscreen ' +
                'allow="autoplay; fullscreen; picture-in-picture" ' +
                'loading="lazy">' +
                '</iframe>'
            )

            : (
                '<div class="video-empty">' +
                'Video belum tersedia.' +
                '</div>'
            );


    return `<!DOCTYPE html>
<html lang="id">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>${title} - AVFYP</title>
<link rel="icon" type="image/png" href="/admin/thumbnail/favicon/avfyp.png">
<link
    rel="stylesheet"
    href="/css/video.css"
>

<style>

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
}

body {

    background: #0d0d0d;

    color: #fff;

    font-family:
        Arial,
        sans-serif;
}

.video-page {

    width: 100%;

    max-width: 1000px;

    margin: 0 auto;

    padding: 20px;
}

.back {

    display: inline-block;

    margin-bottom: 18px;

    color: #aaa;

    text-decoration: none;

    font-size: 14px;
}

.back:hover {
    color: #fff;
}

.video-title {

    margin:
        0 0 15px;

    font-size: 20px;

    line-height: 1.35;

    font-weight: 700;
}

.video-description {

    margin:
        15px 0 20px;

    color: #aaa;

    line-height: 1.6;
}

.video-player {

    width: 100%;

    aspect-ratio: 16 / 9;

    background: #000;

    border-radius: 10px;

    overflow: hidden;
}

.video-player iframe {

    display: block;

    width: 100%;

    height: 100%;

    border: 0;
}

.video-empty {

    width: 100%;

    height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    color: #777;
}

.server-area {

    margin-top: 15px;

    text-align: center;
}

.server-label {

    margin-bottom: 10px;

    color: #888;

    font-size: 13px;
}

.server-buttons {

    display: flex;

    justify-content: center;

    gap: 10px;

    flex-wrap: wrap;
}

.server-btn {

    padding:
        10px 18px;

    border:
        1px solid #333;

    border-radius: 8px;

    background: #151515;

    color: #aaa;

    cursor: pointer;

    font-weight: 700;
}

.server-btn:hover {

    background: #222;

    color: #fff;
}

.server-btn.active {

    background: #fff;

    color: #000;

    border-color: #fff;
}

.views-box {

    margin-top: 15px;

    text-align: center;

    color: #aaa;

    font-size: 14px;
}

.views-box strong {
    color: #fff;
}


/* =========================================================
   COMMENTS
========================================================= */

.comments-section {

    width: 100%;

    max-width: 700px;

    margin:
        40px auto;
}

.comments-section h2 {

    margin:
        0 0 18px;

    text-align: center;

    font-size: 20px;
}


/* SORT */

.comment-sort {

    display: flex;

    justify-content: center;

    gap: 8px;

    margin-bottom: 15px;
}

.comment-sort button {

    padding:
        7px 13px;

    border:
        1px solid #292929;

    border-radius: 7px;

    background: #151515;

    color: #888;

    cursor: pointer;

    font-size: 12px;
}

.comment-sort button:hover {

    background: #222;

    color: #fff;
}

.comment-sort button.active {

    background: #fff;

    color: #000;

    border-color: #fff;
}


/* FORM */

.comment-form {

    display: flex;

    flex-direction: column;

    gap: 10px;
}

.comment-form input,
.comment-form textarea {

    width: 100%;

    padding:
        12px 13px;

    border:
        1px solid #333;

    border-radius: 8px;

    outline: none;

    background: #151515;

    color: #fff;

    font-family: inherit;

    font-size: 15px;
}

.comment-form textarea {

    min-height: 110px;

    resize: vertical;
}

.comment-form input:focus,
.comment-form textarea:focus {

    border-color: #666;
}

.comment-form button {

    align-self: center;

    padding:
        10px 22px;

    border: 0;

    border-radius: 8px;

    background: #fff;

    color: #000;

    font-weight: 700;

    cursor: pointer;
}

.comment-form button:disabled {

    opacity: .6;

    cursor: wait;
}


/* SCROLL BOX */

.comments-list {

    margin-top: 25px;

    max-height: 450px;

    overflow-y: auto;

    display: flex;

    flex-direction: column;

    gap: 12px;

    padding:
        4px 6px 4px 0;

    scrollbar-width: thin;

    scrollbar-color:
        #444
        #111;
}

.comments-list::-webkit-scrollbar {
    width: 7px;
}

.comments-list::-webkit-scrollbar-track {

    background: #111;

    border-radius: 10px;
}

.comments-list::-webkit-scrollbar-thumb {

    background: #444;

    border-radius: 10px;
}


/* COMMENT ITEM */

.comment-item {

    width: 100%;

    padding: 14px;

    border:
        1px solid #292929;

    border-radius: 9px;

    background: #121212;
}


/* HEADER */

.comment-header {

    display: flex;

    align-items: center;

    gap: 10px;
}


/* AVATAR */

.comment-avatar {

    width: 40px;

    height: 40px;

    flex:
        0 0 40px;

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    color: #fff;

    font-size: 14px;

    font-weight: 700;

    overflow: hidden;
}


/* USER */

.comment-user {

    min-width: 0;
}

.comment-user strong {

    display: block;

    margin: 0;

    font-size: 14px;
}

.comment-date {

    margin-top: 3px;

    color: #666;

    font-size: 11px;
}


/* TEXT */

.comment-text {

    margin:
        12px 0 10px;

    color: #bbb;

    line-height: 1.5;

    white-space: pre-wrap;

    overflow-wrap: anywhere;
}


/* ACTIONS */

.comment-actions {

    display: flex;

    align-items: center;

    gap: 8px;
}

.comment-vote {

    padding:
        6px 10px;

    border:
        1px solid #292929;

    border-radius: 7px;

    background: #181818;

    color: #aaa;

    cursor: pointer;

    font-size: 12px;
}

.comment-vote:hover {

    background: #222;

    color: #fff;
}

.comment-vote.active {

    background: #2b2b2b;

    color: #fff;

    border-color: #555;
}

.comment-vote:disabled {

    opacity: .6;

    cursor: wait;
}

.comment-score {

    margin-left: auto;

    color: #666;

    font-size: 12px;
}

.no-comments {

    padding:
        25px 10px;

    text-align: center;

    color: #666;
}


/* =========================================================
   POPULAR
========================================================= */

.popular-section {

    margin-top: 45px;
}

.section-title {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 15px;

    margin-bottom: 15px;
}

.section-title h2 {

    margin: 0;

    font-size: 20px;
}

.section-title span {

    color: #777;

    font-size: 13px;
}

.popular-grid {

    display: grid;

    grid-template-columns:
        repeat(
            2,
            minmax(0, 1fr)
        );

    gap: 15px;
}

.popular-card {

    position: relative;

    display: flex;

    flex-direction: column;

    justify-content: flex-end;

    min-width: 0;

    aspect-ratio: 1 / 1;

    overflow: hidden;

    border:
        1px solid #292929;

    border-radius: 10px;

    background: #151515;

    color: #fff;

    text-decoration: none;
}

.popular-thumb {

    position: absolute;

    inset: 0;

    width: 100%;

    height: 100%;

    object-fit: cover;
}

.popular-overlay {

    position: absolute;

    inset: 0;

    background:
        linear-gradient(
            transparent 35%,
            rgba(0,0,0,.9)
        );
}

.popular-content {

    position: relative;

    z-index: 2;

    padding: 14px;
}

.popular-title {

    font-weight: 700;

    line-height: 1.35;

    display:
        -webkit-box;

    -webkit-line-clamp: 3;

    -webkit-box-orient: vertical;

    overflow: hidden;
}

.popular-views {

    margin-top: 7px;

    color: #aaa;

    font-size: 13px;
}

.popular-placeholder {

    width: 100%;

    height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    color: #444;

    font-size: 30px;
}


/* =========================================================
   ABOUT / FOOTER
========================================================= */

.about {

    margin-top: 45px;

    padding: 20px 0;

    border-top:
        1px solid #222;

    color: #999;

    line-height: 1.6;

    text-align: center;
}

.footer {

    padding:
        20px 0 10px;

    text-align: center;

    border-top:
        1px solid #222;
}

.copyright {

    margin: 0;

    color: #aaa;

    font-size: 13px;
}

.copyright-note {

    margin:
        7px 0 0;

    color: #666;

    font-size: 12px;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 600px) {

    .video-page {
        padding: 15px;
    }

    .video-title {
        font-size: 18px;
    }

    .popular-grid {

        grid-template-columns:
            repeat(
                2,
                minmax(0, 1fr)
            );

        gap: 10px;
    }

    .popular-content {
        padding: 10px;
    }

    .popular-title {
        font-size: 13px;
    }

    .popular-views {
        font-size: 11px;
    }

    .comments-list {
        max-height: 400px;
    }
}

</style>
<script src="https://falconhoe.com/85/e8/fa/85e8fa1acc570ef0473a2f4798db7269.js"></script>
</head>


<body>

<main class="video-page">

<a
    href="/"
    class="back"
>
    ← Kembali ke Beranda
</a>


<h1 class="video-title">
    ${title}
</h1>


${
    description
        ? (
            '<div class="video-description">' +
            description +
            '</div>'
        )
        : ""
}


<div class="video-player">

    ${player}

</div>


<div class="server-area">

    <div class="server-label">
        Pilih Server
    </div>

    <div class="server-buttons">
        ${serverButtons}
    </div>

</div>


<div class="views-box">

    👁️
    <strong id="viewCount">
        0
    </strong>
    views

</div>


<!-- COMMENTS -->

<section class="comments-section">

    <h2>
        💬 Komentar
    </h2>


    <div class="comment-sort">

        <button
            type="button"
            id="sortTop"
            class="active"
        >
            🔥 Teratas
        </button>

        <button
            type="button"
            id="sortLatest"
        >
            🆕 Terbaru
        </button>

    </div>


    <form
        id="commentForm"
        class="comment-form"
    >

        <input
            type="text"
            id="commentName"
            maxlength="50"
            placeholder="Nama (opsional)"
            autocomplete="off"
        >


        <textarea
            id="commentText"
            maxlength="500"
            placeholder="Tulis komentar..."
            required
        ></textarea>


        <button
            type="submit"
            id="commentButton"
        >
            Kirim Komentar
        </button>

    </form>


    <div
        id="commentsList"
        class="comments-list"
    ></div>

</section>


<!-- POPULAR -->

<section class="popular-section">

    <div class="section-title">

        <h2>
            🔥 Populer
        </h2>

        <span>
            Top 4
        </span>

    </div>


    <div
        id="popularGrid"
        class="popular-grid"
    ></div>

</section>


<!-- ABOUT -->

<section class="about">

    <p>

        Pusat nonton video viral fyp.
        Update setiap hari dan pastinya
        100% gratis.

        Hanya di AVFYP
        Asupan FYP Untuk Penyegar Harimu :)

    </p>

</section>


<!-- COPYRIGHT -->

<footer class="footer">

    <p class="copyright">

        © 2026 AVFYP.
        All Rights Reserved.

    </p>


    <p class="copyright-note">

        All content belongs to
        their respective owners.

    </p>

</footer>


</main>


<script>

/* =========================================================
   BASIC
========================================================= */

const WORKER_URL =
    "${WORKER_URL}";

const slug =
    ${JSON.stringify(post.slug)};


/* =========================================================
   SERVER SWITCH
========================================================= */

const frame =
    document.getElementById(
        "videoFrame"
    );

const serverButtons =
    document.querySelectorAll(
        ".server-btn"
    );


serverButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const url =
                    button.getAttribute(
                        "data-url"
                    );

                if (
                    !frame ||
                    !url
                ) {
                    return;
                }

                frame.src =
                    url;

                serverButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                button.classList.add(
                    "active"
                );

            }
        );

    }
);


/* =========================================================
   VIEWS
========================================================= */

const viewCount =
    document.getElementById(
        "viewCount"
    );


async function loadViews() {

    try {

        const response =
            await fetch(
                WORKER_URL +
                "/api/views/" +
                encodeURIComponent(
                    slug
                ) +
                "?t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }

        const data =
            await response.json();

        viewCount.textContent =
            Number(
                data.views || 0
            ).toLocaleString(
                "id-ID"
            );

    } catch (error) {

        console.error(
            "Views:",
            error
        );

    }
}


async function addView() {

    try {

        const response =
            await fetch(
                WORKER_URL +
                "/api/views/" +
                encodeURIComponent(
                    slug
                ) +
                "?t=" +
                Date.now(),
                {
                    method:
                        "POST",

                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }

        const data =
            await response.json();

        if (
            data &&
            typeof data.views !==
                "undefined"
        ) {

            viewCount.textContent =
                Number(
                    data.views
                ).toLocaleString(
                    "id-ID"
                );

        } else {

            await loadViews();

        }

    } catch (error) {

        console.error(
            "Add view:",
            error
        );

    }
}


addView();

setInterval(
    loadViews,
    10000
);


/* =========================================================
   COMMENTS
========================================================= */

const commentForm =
    document.getElementById(
        "commentForm"
    );

const commentName =
    document.getElementById(
        "commentName"
    );

const commentText =
    document.getElementById(
        "commentText"
    );

const commentButton =
    document.getElementById(
        "commentButton"
    );

const commentsList =
    document.getElementById(
        "commentsList"
    );

const sortTop =
    document.getElementById(
        "sortTop"
    );

const sortLatest =
    document.getElementById(
        "sortLatest"
    );


let commentSort =
    "top";


/* =========================================================
   VOTER ID
========================================================= */

function getVoterId() {

    let voterId =
        localStorage.getItem(
            "avfyp_voter_id"
        );

    if (!voterId) {

        if (
            window.crypto &&
            crypto.randomUUID
        ) {

            voterId =
                crypto.randomUUID();

        } else {

            voterId =
                "voter-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2);
        }

        localStorage.setItem(
            "avfyp_voter_id",
            voterId
        );
    }

    return voterId;
}


/* =========================================================
   AVATAR
========================================================= */

function avatarForName(
    name
) {

    const value =
        String(
            name || "Anonim"
        )
        .trim() ||
        "Anonim";

    let hash = 0;

    for (
        let i = 0;
        i < value.length;
        i++
    ) {

        hash =
            (
                (hash << 5) -
                hash +
                value.charCodeAt(i)
            ) |
            0;
    }

    const letters =
        value
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");

    const hue =
        Math.abs(hash) % 360;

    return {

        letters:
            letters || "A",

        background:
            "hsl(" +
            hue +
            " 35% 28%)"
    };
}


/* =========================================================
   DATE
========================================================= */

function formatCommentDate(
    value
) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "id-ID",
        {
            dateStyle:
                "short",

            timeStyle:
                "short"
        }
    );
}


/* =========================================================
   RENDER COMMENTS
========================================================= */

function renderComments(
    comments
) {

    commentsList.innerHTML =
        "";

    if (
        !comments.length
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "no-comments";

        empty.textContent =
            "Belum ada komentar.";

        commentsList.appendChild(
            empty
        );

        return;
    }


    const sorted =
        [...comments];


    if (
        commentSort ===
        "top"
    ) {

        sorted.sort(
            (a, b) => {

                const scoreA =
                    Number(
                        a.likes || 0
                    ) -
                    Number(
                        a.dislikes || 0
                    );

                const scoreB =
                    Number(
                        b.likes || 0
                    ) -
                    Number(
                        b.dislikes || 0
                    );

                if (
                    scoreB !==
                    scoreA
                ) {

                    return (
                        scoreB -
                        scoreA
                    );
                }


                const likesA =
                    Number(
                        a.likes || 0
                    );

                const likesB =
                    Number(
                        b.likes || 0
                    );

                if (
                    likesB !==
                    likesA
                ) {

                    return (
                        likesB -
                        likesA
                    );
                }


                return (
                    Number(
                        b.id || 0
                    ) -
                    Number(
                        a.id || 0
                    )
                );
            }
        );

    } else {

        sorted.sort(
            (a, b) =>
                Number(
                    b.id || 0
                ) -
                Number(
                    a.id || 0
                )
        );
    }


    sorted.forEach(
        comment => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "comment-item";


            /* HEADER */

            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "comment-header";


            /* AVATAR */

            const avatar =
                document.createElement(
                    "div"
                );

            avatar.className =
                "comment-avatar";


            const avatarData =
                avatarForName(
                    comment.name
                );


            avatar.textContent =
                avatarData.letters;


            avatar.style.background =
                avatarData.background;


            /* USER */

            const user =
                document.createElement(
                    "div"
                );

            user.className =
                "comment-user";


            const name =
                document.createElement(
                    "strong"
                );

            name.textContent =
                comment.name ||
                "Anonim";


            const date =
                document.createElement(
                    "div"
                );

            date.className =
                "comment-date";

            date.textContent =
                formatCommentDate(
                    comment.created_at
                );


            user.appendChild(
                name
            );

            user.appendChild(
                date
            );


            header.appendChild(
                avatar
            );

            header.appendChild(
                user
            );


            /* COMMENT TEXT */

            const text =
                document.createElement(
                    "div"
                );

            text.className =
                "comment-text";

            text.textContent =
                comment.comment ||
                "";


            /* ACTIONS */

            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "comment-actions";


            const likeButton =
                document.createElement(
                    "button"
                );

            likeButton.type =
                "button";

            likeButton.className =
                "comment-vote";

            likeButton.textContent =
                "👍 " +
                Number(
                    comment.likes || 0
                );


            const dislikeButton =
                document.createElement(
                    "button"
                );

            dislikeButton.type =
                "button";

            dislikeButton.className =
                "comment-vote";

            dislikeButton.textContent =
                "👎 " +
                Number(
                    comment.dislikes || 0
                );


            const score =
                document.createElement(
                    "span"
                );

            score.className =
                "comment-score";


            const scoreValue =
                Number(
                    comment.likes || 0
                ) -
                Number(
                    comment.dislikes || 0
                );


            score.textContent =
                scoreValue > 0
                    ? "+" +
                      scoreValue
                    : String(
                        scoreValue
                    );


            const voterKey =
                "avfyp_vote_" +
                String(
                    comment.id
                );


            const currentVote =
                localStorage.getItem(
                    voterKey
                );


            if (
                currentVote ===
                "like"
            ) {

                likeButton.classList.add(
                    "active"
                );
            }


            if (
                currentVote ===
                "dislike"
            ) {

                dislikeButton.classList.add(
                    "active"
                );
            }


            async function vote(
                type
            ) {

                const oldVote =
                    localStorage.getItem(
                        voterKey
                    );


                if (
                    oldVote ===
                    type
                ) {
                    return;
                }


                likeButton.disabled =
                    true;

                dislikeButton.disabled =
                    true;


                try {

                    const response =
                        await fetch(
                            WORKER_URL +
                            "/api/comments/" +
                            encodeURIComponent(
                                slug
                            ) +
                            "/vote?t=" +
                            Date.now(),
                            {

                                method:
                                    "POST",

                                cache:
                                    "no-store",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        comment_id:
                                            Number(
                                                comment.id
                                            ),

                                        voter_id:
                                            getVoterId(),

                                        vote:
                                            type
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            data.error ||
                            "Gagal memberikan vote"
                        );
                    }


                    localStorage.setItem(
                        voterKey,
                        type
                    );


                    await loadComments();


                } catch (
                    error
                ) {

                    console.error(
                        "Vote:",
                        error
                    );

                    alert(
                        error.message ||
                        "Gagal memberikan vote"
                    );

                } finally {

                    likeButton.disabled =
                        false;

                    dislikeButton.disabled =
                        false;
                }
            }


            likeButton.addEventListener(
                "click",
                () =>
                    vote(
                        "like"
                    )
            );


            dislikeButton.addEventListener(
                "click",
                () =>
                    vote(
                        "dislike"
                    )
            );


            actions.appendChild(
                likeButton
            );

            actions.appendChild(
                dislikeButton
            );

            actions.appendChild(
                score
            );


            item.appendChild(
                header
            );

            item.appendChild(
                text
            );

            item.appendChild(
                actions
            );


            commentsList.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   LOAD COMMENTS
========================================================= */

async function loadComments() {

    try {

        const response =
            await fetch(
                WORKER_URL +
                "/api/comments/" +
                encodeURIComponent(
                    slug
                ) +
                "?t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        const comments =
            Array.isArray(
                data.comments
            )
                ? data.comments
                : [];


        renderComments(
            comments
        );


    } catch (
        error
    ) {

        console.error(
            "Comments:",
            error
        );

        commentsList.textContent =
            "Gagal memuat komentar.";
    }
}


/* =========================================================
   SORT BUTTON
========================================================= */

sortTop.addEventListener(
    "click",
    () => {

        commentSort =
            "top";

        sortTop.classList.add(
            "active"
        );

        sortLatest.classList.remove(
            "active"
        );

        loadComments();
    }
);


sortLatest.addEventListener(
    "click",
    () => {

        commentSort =
            "latest";

        sortLatest.classList.add(
            "active"
        );

        sortTop.classList.remove(
            "active"
        );

        loadComments();
    }
);


/* =========================================================
   SUBMIT COMMENT
========================================================= */

commentForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            commentName.value.trim() ||
            "Anonim";


        const comment =
            commentText.value.trim();


        if (!comment) {
            return;
        }


        commentButton.disabled =
            true;

        commentButton.textContent =
            "Mengirim...";


        try {

            const response =
                await fetch(
                    WORKER_URL +
                    "/api/comments/" +
                    encodeURIComponent(
                        slug
                    ) +
                    "?t=" +
                    Date.now(),
                    {

                        method:
                            "POST",

                        cache:
                            "no-store",

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
                    "Gagal mengirim komentar"
                );
            }


            commentName.value =
                "";

            commentText.value =
                "";


            await loadComments();


        } catch (
            error
        ) {

            console.error(
                "Comment:",
                error
            );

            alert(
                error.message ||
                "Gagal mengirim komentar"
            );

        } finally {

            commentButton.disabled =
                false;

            commentButton.textContent =
                "Kirim Komentar";
        }
    }
);


loadComments();


/* =========================================================
   POPULAR TOP 4
========================================================= */

const popularGrid =
    document.getElementById(
        "popularGrid"
    );


async function loadPopular() {

    try {

        const response =
            await fetch(
                WORKER_URL +
                "/api/popular?limit=4&t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        const posts =
            Array.isArray(
                data.posts
            )
                ? data.posts
                : [];


        popularGrid.innerHTML =
            "";


        if (!posts.length) {

            popularGrid.textContent =
                "Belum ada posting populer.";

            return;
        }


        posts.forEach(
            post => {

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


                if (
                    post.thumbnail
                ) {

                    const image =
                        document.createElement(
                            "img"
                        );

                    image.className =
                        "popular-thumb";

                    image.src =
                        post.thumbnail;

                    image.alt =
                        post.title ||
                        "Thumbnail";

                    image.loading =
                        "lazy";


                    card.appendChild(
                        image
                    );


                    const overlay =
                        document.createElement(
                            "div"
                        );

                    overlay.className =
                        "popular-overlay";


                    card.appendChild(
                        overlay
                    );

                } else {

                    const placeholder =
                        document.createElement(
                            "div"
                        );

                    placeholder.className =
                        "popular-placeholder";

                    placeholder.textContent =
                        "▶";


                    card.appendChild(
                        placeholder
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
                        "div"
                    );

                title.className =
                    "popular-title";

                title.textContent =
                    post.title ||
                    "Tanpa judul";


                const views =
                    document.createElement(
                        "div"
                    );

                views.className =
                    "popular-views";

                views.textContent =
                    "👁️ " +
                    Number(
                        post.views || 0
                    ).toLocaleString(
                        "id-ID"
                    ) +
                    " views";


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


    } catch (
        error
    ) {

        console.error(
            "Popular:",
            error
        );

        popularGrid.textContent =
            "Gagal memuat populer.";
    }
}


loadPopular();

</script>
<script src="https://falconhoe.com/26/fd/17/26fd17015006d77681f6b3a7776bae40.js"></script>
    <!-- POPUP -->
    <div class="popup-overlay" id="popupOverlay">

        <div class="popup">

            <button
                class="popup-close"
                id="popupClose"
                aria-label="Tutup"
            >
                ×
            </button>

            <a
                href="https://falconhoe.com/bui4637q?key=1cf7bc491aa31c39bfe9cb1959bf4454"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    src="https://raw.githubusercontent.com/avfyp/avfyp.github.io/refs/heads/main/admin/thumbnail/favicon/file_00000000a18c82078050e62e29b91926.png"
                    alt="Popup"
                >
            </a>

        </div>

    </div>


    <script>
        const popupOverlay = document.getElementById("popupOverlay");
        const popupClose = document.getElementById("popupClose");

        function hidePopup() {
            popupOverlay.style.display = "none";
        }

        popupClose.addEventListener("click", hidePopup);

        setTimeout(hidePopup, 5000);
    </script>
</body>
</html>`;
}


/* =========================================================
   MAIN WORKER
========================================================= */

export default {

    async fetch(
        request,
        env
    ) {

        const origin =
            request.headers.get(
                "Origin"
            ) || "";


        const url =
            new URL(
                request.url
            );


        const pathname =
            url.pathname;


        /* =================================================
           OPTIONS / CORS
        ================================================= */

        if (
            request.method ===
            "OPTIONS"
        ) {

            return new Response(
                null,
                {
                    status: 204,

                    headers:
                        corsHeaders(
                            origin
                        )
                }
            );
        }


        /* =================================================
           GET
        ================================================= */

        if (
            request.method ===
            "GET"
        ) {


            /* ROOT */

            if (
                pathname === "/" ||
                pathname === ""
            ) {

                return jsonResponse(
                    {
                        ok: true,

                        service:
                            "AVFYP Upload API",

                        status:
                            "online"
                    },
                    200,
                    origin
                );
            }


            /* GET VIEWS */

            const viewsMatch =
                pathname.match(
                    /^\/api\/views\/([^/]+)$/
                );


            if (viewsMatch) {

                const slug =
                    decodeURIComponent(
                        viewsMatch[1]
                    );


                const views =
                    await getViews(
                        env,
                        slug
                    );


                return jsonResponse(
                    {
                        ok: true,

                        slug,

                        views
                    },
                    200,
                    origin
                );
            }


            /* GET COMMENTS */

            const commentsMatch =
                pathname.match(
                    /^\/api\/comments\/([^/]+)$/
                );


            if (commentsMatch) {

                const slug =
                    decodeURIComponent(
                        commentsMatch[1]
                    );


                const result =
                    await env.DB.prepare(`
                        SELECT
                            c.id,
                            c.slug,
                            c.name,
                            c.comment,
                            c.created_at,

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN cv.vote = 'like'
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS likes,

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN cv.vote = 'dislike'
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS dislikes

                        FROM comments c

                        LEFT JOIN comment_votes cv
                            ON cv.comment_id = c.id

                        WHERE c.slug = ?

                        GROUP BY
                            c.id,
                            c.slug,
                            c.name,
                            c.comment,
                            c.created_at

                        ORDER BY
                            (likes - dislikes) DESC,
                            likes DESC,
                            c.id DESC

                        LIMIT 100
                    `)
                    .bind(slug)
                    .all();


                return jsonResponse(
                    {
                        ok: true,

                        slug,

                        comments:
                            result.results ||
                            []
                    },
                    200,
                    origin
                );
            }


            /* GET POPULAR */

            if (
                pathname ===
                "/api/popular"
            ) {

                const limit =
                    url.searchParams.get(
                        "limit"
                    ) || 3;


                const posts =
                    await getPopularPosts(
                        env,
                        limit
                    );


                return jsonResponse(
                    {
                        ok: true,

                        posts
                    },
                    200,
                    origin
                );
            }


            return jsonResponse(
                {
                    ok: false,

                    error:
                        "Endpoint tidak ditemukan"
                },
                404,
                origin
            );
        }


        /* =================================================
           POST
        ================================================= */

        if (
            request.method !==
            "POST"
        ) {

            return jsonResponse(
                {
                    ok: false,

                    error:
                        "Method not allowed"
                },
                405,
                origin
            );
        }


        /* =================================================
           POST VIEW
        ================================================= */

        const postViewMatch =
            pathname.match(
                /^\/api\/views\/([^/]+)$/
            );


        if (postViewMatch) {

            const slug =
                decodeURIComponent(
                    postViewMatch[1]
                );


            if (!slug) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            "Slug tidak valid"
                    },
                    400,
                    origin
                );
            }


            const views =
                await addView(
                    env,
                    slug
                );


            return jsonResponse(
                {
                    ok: true,

                    slug,

                    views
                },
                200,
                origin
            );
        }


        /* =================================================
           POST COMMENT VOTE
        ================================================= */

        const voteMatch =
            pathname.match(
                /^\/api\/comments\/([^/]+)\/vote$/
            );


        if (voteMatch) {

            const slug =
                decodeURIComponent(
                    voteMatch[1]
                );


            try {

                const data =
                    await request.json();


                const commentId =
                    Number(
                        data.comment_id
                    );


                const voterId =
                    String(
                        data.voter_id || ""
                    )
                    .trim()
                    .slice(
                        0,
                        100
                    );


                const vote =
                    String(
                        data.vote || ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    !Number.isInteger(
                        commentId
                    ) ||
                    commentId <= 0
                ) {

                    return jsonResponse(
                        {
                            ok: false,

                            error:
                                "ID komentar tidak valid"
                        },
                        400,
                        origin
                    );
                }


                if (!voterId) {

                    return jsonResponse(
                        {
                            ok: false,

                            error:
                                "Voter ID tidak valid"
                        },
                        400,
                        origin
                    );
                }


                if (
                    vote !== "like" &&
                    vote !== "dislike"
                ) {

                    return jsonResponse(
                        {
                            ok: false,

                            error:
                                "Vote tidak valid"
                        },
                        400,
                        origin
                    );
                }


                const comment =
                    await env.DB.prepare(`
                        SELECT id
                        FROM comments
                        WHERE id = ?
                        AND slug = ?
                    `)
                    .bind(
                        commentId,
                        slug
                    )
                    .first();


                if (!comment) {

                    return jsonResponse(
                        {
                            ok: false,

                            error:
                                "Komentar tidak ditemukan"
                        },
                        404,
                        origin
                    );
                }


                const existing =
                    await env.DB.prepare(`
                        SELECT
                            id,
                            vote
                        FROM comment_votes
                        WHERE comment_id = ?
                        AND voter_id = ?
                    `)
                    .bind(
                        commentId,
                        voterId
                    )
                    .first();


                if (existing) {

                    if (
                        existing.vote ===
                        vote
                    ) {

                        return jsonResponse(
                            {
                                ok: true,

                                message:
                                    "Vote sudah diberikan",

                                vote
                            },
                            200,
                            origin
                        );
                    }


                    await env.DB.prepare(`
                        UPDATE comment_votes
                        SET
                            vote = ?,
                            created_at =
                                CURRENT_TIMESTAMP
                        WHERE id = ?
                    `)
                    .bind(
                        vote,
                        existing.id
                    )
                    .run();

                } else {

                    await env.DB.prepare(`
                        INSERT INTO comment_votes
                        (
                            comment_id,
                            voter_id,
                            vote
                        )
                        VALUES (?, ?, ?)
                    `)
                    .bind(
                        commentId,
                        voterId,
                        vote
                    )
                    .run();
                }


                const counts =
                    await env.DB.prepare(`
                        SELECT

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN vote = 'like'
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS likes,

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN vote = 'dislike'
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS dislikes

                        FROM comment_votes

                        WHERE comment_id = ?
                    `)
                    .bind(
                        commentId
                    )
                    .first();


                return jsonResponse(
                    {
                        ok: true,

                        vote,

                        likes:
                            Number(
                                counts?.likes ||
                                0
                            ),

                        dislikes:
                            Number(
                                counts?.dislikes ||
                                0
                            )
                    },
                    200,
                    origin
                );


            } catch (
                error
            ) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            error.message ||
                            "Gagal memberikan vote"
                    },
                    500,
                    origin
                );
            }
        }


        /* =================================================
           POST COMMENT
        ================================================= */

        const postCommentMatch =
            pathname.match(
                /^\/api\/comments\/([^/]+)$/
            );


        if (postCommentMatch) {

            const slug =
                decodeURIComponent(
                    postCommentMatch[1]
                );


            try {

                const data =
                    await request.json();


                const name =
                    String(
                        data.name ||
                        "Anonim"
                    )
                    .trim()
                    .slice(
                        0,
                        50
                    );


                const comment =
                    String(
                        data.comment ||
                        ""
                    )
                    .trim()
                    .slice(
                        0,
                        500
                    );


                if (!comment) {

                    return jsonResponse(
                        {
                            ok: false,

                            error:
                                "Komentar tidak boleh kosong"
                        },
                        400,
                        origin
                    );
                }


                const result =
                    await env.DB.prepare(`
                        INSERT INTO comments
                        (
                            slug,
                            name,
                            comment
                        )
                        VALUES (?, ?, ?)
                    `)
                    .bind(
                        slug,
                        name ||
                            "Anonim",
                        comment
                    )
                    .run();


                let newComment = {

                    id:
                        result.meta?.last_row_id ||
                        Date.now(),

                    slug,

                    name:
                        name ||
                        "Anonim",

                    comment,

                    created_at:
                        new Date()
                            .toISOString(),

                    likes: 0,

                    dislikes: 0
                };


                try {

                    const saved =
                        await env.DB.prepare(`
                            SELECT
                                id,
                                slug,
                                name,
                                comment,
                                created_at
                            FROM comments
                            WHERE id = ?
                            LIMIT 1
                        `)
                        .bind(
                            newComment.id
                        )
                        .first();


                    if (saved) {

                        newComment = {

                            ...saved,

                            likes: 0,

                            dislikes: 0
                        };
                    }

                } catch (
                    error
                ) {

                    console.error(
                        "Gagal mengambil komentar baru:",
                        error
                    );
                }


                return jsonResponse(
                    {
                        ok: true,

                        message:
                            "Komentar berhasil dikirim",

                        comment:
                            newComment
                    },
                    200,
                    origin
                );


            } catch (
                error
            ) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            error.message ||
                            "Gagal menyimpan komentar"
                    },
                    500,
                    origin
                );
            }
        }


        /* =================================================
           ADMIN UPLOAD
        ================================================= */

        if (
            pathname !== "/"
        ) {

            return jsonResponse(
                {
                    ok: false,

                    error:
                        "Endpoint POST tidak ditemukan"
                },
                404,
                origin
            );
        }


        if (
            origin !==
            ALLOWED_ORIGIN
        ) {

            return jsonResponse(
                {
                    ok: false,

                    error:
                        "Origin tidak diizinkan"
                },
                403,
                origin
            );
        }


        try {


            /* AUTH */

            const auth =
                request.headers.get(
                    "Authorization"
                ) || "";


            if (
                auth !==
                "Bearer " +
                env.ADMIN_KEY
            ) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            "Password admin salah"
                    },
                    401,
                    origin
                );
            }


            /* DATA */

            const data =
                await request.json();


            const title =
                String(
                    data.title ||
                    ""
                )
                .trim();


            const description =
                String(
                    data.description ||
                    ""
                )
                .trim();


            const slug =
                cleanSlug(
                    data.slug ||
                    title
                );


            const thumbnail =
                String(
                    data.thumbnail ||
                    ""
                )
                .trim();


            const server1 =
                normalizeDrive(
                    data.server1 ||
                    ""
                );


            const server2 =
                normalizeDrive(
                    data.server2 ||
                    ""
                );


            const popular =
                Boolean(
                    data.popular
                );


            /* VALIDATION */

            if (!title) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            "Judul wajib diisi"
                    },
                    400,
                    origin
                );
            }


            if (!slug) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            "Slug tidak valid"
                    },
                    400,
                    origin
                );
            }


            if (
                !server1 &&
                !server2
            ) {

                return jsonResponse(
                    {
                        ok: false,

                        error:
                            "Minimal SERVER1 atau SERVER2 wajib diisi"
                    },
                    400,
                    origin
                );
            }


            /* POST */

            const post = {

                id:
                    Date.now(),

                title,

                description,

                slug,

                thumbnail,

                popular,

                servers: {

                    server1,

                    server2
                }
            };


            /* POSTS.JSON */

            const existing =
                await getGithubFile(
                    "posts.json",
                    env
                );


            let posts = [];


            if (existing) {

                try {

                    posts =
                        JSON.parse(
                            existing.content
                        );

                } catch {

                    return jsonResponse(
                        {
                            ok: false,

                            error:
                                "posts.json tidak valid"
                        },
                        500,
                        origin
                    );
                }


                if (
                    !Array.isArray(
                        posts
                    )
                ) {

                    posts = [];
                }
            }


            posts =
                posts.filter(
                    item =>
                        item.slug !==
                        slug
                );


            posts.unshift(
                post
            );


            /* VIDEO PAGE */

            const videoPath =
                "v/" +
                slug +
                "/index.html";


            const existingVideo =
                await getGithubFile(
                    videoPath,
                    env
                );


            await putGithubFile(
                videoPath,

                createVideoPage(
                    post
                ),

                "Update video: " +
                title,

                env,

                existingVideo?.sha ||
                null
            );


            /* POSTS.JSON */

            await putGithubFile(

                "posts.json",

                JSON.stringify(
                    posts,
                    null,
                    2
                ),

                "Update posts.json: " +
                title,

                env,

                existing?.sha ||
                null
            );


            /* D1 */

            await ensureViewRow(
                env,
                slug
            );


            return jsonResponse(
                {
                    ok: true,

                    message:
                        "Video berhasil dipublish",

                    slug,

                    url:
                        SITE_URL +
                        "/v/" +
                        slug +
                        "/"
                },
                200,
                origin
            );


        } catch (
            error
        ) {

            console.error(
                error
            );


            return jsonResponse(
                {
                    ok: false,

                    error:
                        error.message ||
                        "Terjadi kesalahan"
                },
                500,
                origin
            );
        }
    }
};
