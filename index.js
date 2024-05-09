import { isMobileDevice } from "../modules/device.js";
import { notify } from "../modules/notify.js";

const msg_success = "[✔️] Success";
const msg_err = "[❌] Error";

let dynamic_content;
let reading_window;
let reading_content;
let btn_reading_window_leave;
let loading_screen;
let CURRENT_POST = "";
let lazyloadImages;

function cast_loading_screen() {
  if (loading_screen) {
    loading_screen.classList.toggle("on");
  } else {
    console.error("Loading screen element not found.");
  }
}

function check_URL_for_matching_post(args) {
  if (!args?.title) {
    notify({
      message: `${msg_err} ?posts=_FETCH_FAILED`,
      timeout: 10,
    });
    return;
  }

  if (
    window.location.href
      .toLowerCase()
      .includes(args?.title.toLowerCase().replace(/ /g, "-"))
  ) {
    show_reader(args);
  }
}

function lazyload() {
  if ("IntersectionObserver" in window) {
    lazyloadImages = document.querySelectorAll(".image");

    let imageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let image = entry.target;

          if (image.dataset.src) {
            image.src = image.dataset.src;
          } else {
            console.error(
              "No 'data-src' attribute found on the image element."
            );
          }

          image.classList.remove(".lazy");
          imageObserver.unobserve(image);
          // image.src = image.dataset.src;
          // console.log("I can see:");
        }
      });
    });

    lazyloadImages.forEach(function (image) {
      imageObserver.observe(image);
    });
  }
}

async function show_reader(args) {
  if (!args?.file || !args?.title) {
    return;
  }

  try {
    const response = await fetch(`../posts/${args?.file}`);
    const markdown = await response.text();

    var converter = new showdown.Converter({ smoothPreview: true });
    converter.setFlavor("github");

    const result = converter.makeHtml(markdown);

    reading_window.style.display = "block";
    reading_content.innerHTML = `<h1>${args?.title}</h1>` + result;

    CURRENT_POST = args?.title;

    return true;
  } catch (error) {
    console.error("Error fetching Markdown file:", error);
    return false;
  }
}

function assign_data_to_element(args) {
  if (!args?.elem_class || !args?.elem_str || !args?.elem_type) {
    return;
  }

  const elements = document.getElementsByClassName(args?.elem_class);
  for (var i = 0; i < elements.length; i++) {
    switch (args?.elem_type) {
      case "textContent":
        elements[i].textContent = args?.elem_str;
        break;
      case "href":
        elements[i].href = args?.elem_str;
        break;
    }
  }
}

async function load_dynamic_categories() {
  try {
    const site_json = await fetch("site.json");
    const entries_json = await fetch("entries.json");

    const site_data = await site_json.json();
    const entries_data = await entries_json.json();

    document.title = site_data[0].author;

    assign_data_to_element({
      elem_class: "author",
      elem_str: site_data[0].author,
      elem_type: "textContent",
    });

    assign_data_to_element({
      elem_class: "repo",
      elem_str: site_data[0].repo,
      elem_type: "href",
    });

    assign_data_to_element({
      elem_class: "build_date",
      elem_str: site_data[0].last_build,
      elem_type: "textContent",
    });

    for (let i = 0; i < entries_data.length; i++) {
      const item = entries_data[i];

      check_URL_for_matching_post(item);

      let section;

      if (!document.querySelector(`#${item.tag}`)) {
        const outer_section = document.createElement("div");
        const section_title = document.createElement("h1");
        outer_section.classList.add("post_section", "column");
        section_title.textContent = item.tag;
        outer_section.appendChild(section_title);
        section = document.createElement("div");
        section.id = item.tag;
        section.classList.add("post_section", "inner", "row");
        outer_section.appendChild(section);
        dynamic_content.appendChild(outer_section);
      } else {
        section = document.querySelector(`#${item.tag}`);
      }

      const div = document.createElement("div");
      const title = document.createElement("h1");
      const tn = document.createElement("img");
      const date = document.createElement("p");

      div.classList.add("post_tile", "container", "outline");
      tn.classList.add("post_thumbnail");
      title.textContent = item.title;
      date.textContent = dayjs(item.date).fromNow();

      if (item.tn) {
        tn.dataset.src = `../assets/${item.tn}`;
        tn.classList.add("lazy", "image");
      }

      if (item.draft) {
        title.style.color = "red";
      }

      div.addEventListener("click", async () => {
        if (item.draft) {
          notify({
            message: `"${item.title}" is still in the works, check back soon!`,
            timeout: 10,
          });
        } else {
          show_reader(item);
        }
      });

      div.appendChild(title);
      div.appendChild(tn);
      div.appendChild(date);
      section.appendChild(div);
    }
  } catch (error) {
    console.error("Error fetching JSON file:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  dynamic_content = document.getElementById("dynamic_content");
  reading_window = document.getElementById("reading_window");
  reading_content = document.getElementById("reading_content");
  btn_reading_window_leave = document.getElementById(
    "btn_reading_window_leave"
  );
  copyright = document.getElementById("copyright");
  loading_screen = document.getElementById("loading-screen");

  cast_loading_screen();

  reading_window.style.display = "none";

  if (isMobileDevice()) {
    alert(
      "The content of this website may be displayed incorrectly; it is highly recommended to view this website on larger screen"
    );
  }

  dayjs.extend(window.dayjs_plugin_relativeTime);

  btn_reading_window_leave.addEventListener("click", () => {
    reading_window.style.display = "none";
    reading_content.innerHTML = "";
  });

  document
    .getElementById("btn_reading_window_share")
    .addEventListener("click", () => {
      let current_URL = window.location.href;
      const cleanUrl = current_URL.replace(/\?posts=.*$/, "");

      if (window.location.href.includes("?posts=")) {
        current_URL = cleanUrl;
      }

      const SHARE_URL = `${current_URL}?posts=${CURRENT_POST.replace(
        / /g,
        "-"
      )}`;

      navigator.clipboard
        .writeText(SHARE_URL)
        .then(() => {
          notify({
            message: `Link Copied!`,
            timeout: 5,
          });
        })
        .catch((error) => {
          notify({
            message: error,
            timeout: 5,
          });
        });
    });

  document
    .getElementById("Uncopyrighted")
    .addEventListener("click", (event) => {
      event.preventDefault();

      show_reader({
        file: "uncopyright.md",
        title: "Uncopyright",
      });
    });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      reading_window.style.display = "none";
    }
  });

  await load_dynamic_categories();
  lazyload();
  cast_loading_screen();
});
