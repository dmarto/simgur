// ==UserScript==
// @name          simgur
// @description   simple imgur post viewer
// @author        dmarto
// @version       2.0.1
// @include       https://imgur.com/a/*
// @include       https://imgur.com/*/embed
// @include       https://imgur.com/gallery/*
// @include       https://i.imgur.com/*.gifv
// @include       /^https:\/\/imgur.com\/[a-zA-Z0-9]{5,7}/
// @inject-into   content
// @grant         none
// ==/UserScript==

const href = document.location.href;
const san_href = document.location.origin + document.location.pathname;

const html = document.getElementsByTagName("html")[0];

if (href.indexOf(".gifv") > 0) {
	document.location.href = href.replace(".gifv", "");
	return;
}

// TODO: some gallery posts are not albums..
if (href.indexOf("gallery") > 0) {
	document.location.href = href.replace("gallery", "a");
	return;
}

if (href.indexOf("/embed") > 0 && href.indexOf("pub=true") < 0) {
	document.location.href = san_href + "?pub=true";
	return
}

if (html.textContent.indexOf("JavaScript has been disabled on your browser") > 0) {
	document.location.href = san_href + "/embed?pub=true";
	return;
}

if (html.textContent.indexOf("By continuing, you acknowledge that you are 18+ years of age.") > 0) {
	document.location.href = san_href + "/embed?pub=true";
	return;
}

const isAlbum = href.indexOf("/a/") > 0;
const isEmbed = href.indexOf("/embed") > 0;

window.scrollTo(0,5);

/****** image & video extraction **************************************/

let images = [];
let videos = [];

function add(elements) {
	for (let i = 0; i < elements.length; i++) {
		let e = elements[i];

		let hash = e.hash || e.id;
		let type = e.hash ? e.ext : e.getAttribute("itemtype");

		switch(type) {
			case "http://schema.org/ImageObject":
				images.push(`//i.imgur.com/${hash}.jpg`);
				break;
			case "http://schema.org/VideoObject":
			case ".mp4":
				videos.push(`//i.imgur.com/${hash}.mp4`);
				break;
			case ".gif":
				images.push(`//i.imgur.com/${hash}.gif`);
				break;
			case ".png":
				images.push(`//i.imgur.com/${hash}.png`);
				break;
			default: images.push(`//i.imgur.com/${hash}.jpg`);
		}
	}
}

// generic pages (album and single)
add(document.getElementsByClassName("post-image-container"));

// embed albums
if(isEmbed && isAlbum) {
	// TODO: refactor
	add(JSON.parse(html.textContent.split("var images")[1].split("albumHash")[0].trim().slice(2, -1)).images);
}

// embed item
if(isEmbed && !isAlbum) {
	let image = document.getElementById("image-element");
	if (image) images.push(image.src);

	let video = document.getElementsByTagName("source")[0];
	if (video) videos.push(video.src);
}

if (!images[0] && !videos[0]) {
	html.innerHTML = "ERROR - no image or video found";
	return;
}

/****** gallery & keybinds ********************************************/

html.innerHTML = `<body style="margin: 0; background-color: #222; text-align: center;"></body>`;

function cont(inner) {
	return `<div style="width: 99vw; height: 99vh; margin: 10px auto;">${inner}</div>`;
}

function image(src) {
	return cont(`<img loading="lazy" src="${src}" style="height: 100%; width: 100%; object-fit: contain;" />`);
}

function video(src) {
	return cont(`<video style="height: 100%; width: 100%; object-fit: contain;" controls><source type="video/mp4" src="${src}" /></video>`);
}

html.innerHTML += videos.map(video).join("") + images.map(image).join("");

document.getElementsByTagName("div")[0].id = "on";

document.addEventListener("keydown", function (e) {
	if ([38, 40, 74, 75].indexOf(e.keyCode) >= 0) {
		let on = document.getElementById("on");

		let next = {
			38: on.previousSibling, // up arrow
			40: on.nextSibling,     // down arrow
			74: on.nextSibling,     // j
			75: on.previousSibling, // k
		}[e.keyCode];

		if (next) {
			on.removeAttribute("id");
			next.id = "on";
			next.scrollIntoView({behavior: "smooth", block: "center"});
		}

		e.preventDefault();
		return false;
	}
});

/****** END ***********************************************************/
