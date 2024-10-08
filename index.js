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
let cd = false;
let total_network_usage = 0;
let converter = new showdown.Converter({ smoothPreview: true });
let debug = document.URL === "http://127.0.0.1:5500/";
let recommended_content;

function remove_blur() {
  const x = document.querySelectorAll("*");
  x.forEach((element) => {
    element.style.filter = "none";
    element.style.backdropFilter = "none";
  });
}

function track_network_usage(elem) {
  // https://stackoverflow.com/questions/28430115/javascript-get-size-in-bytes-from-html-img-src/45409613#45409613
  fetch(elem)
    .then((r) => r.blob())
    .then((blob) => {
      const sizeInMB = blob.size / (1024 * 1024);
      debug && console.log("Blob size:", sizeInMB.toFixed(2), "MB");
      total_network_usage += sizeInMB;
    });
}

function fade_elements_in(args) {
  if (!args?.div || !args?.tag) {
    console.error(args?.div, args?.tag);
    return;
  }

  const elements = document
    .getElementById(args.div)
    .getElementsByTagName(args.tag);

  for (let i = 0; i < elements.length; i++) {
    elements[i].style.opacity = 0;
  }

  for (let i = 0; i < elements.length; i++) {
    setTimeout(() => {
      elements[i].classList.add("fade-in");
      elements[i].style.opacity = 1;
    }, i * 1000);
  }
}

function cooldown(duration) {
  cd = !cd;
  setTimeout(function () {
    cd = !cd;
  }, duration);
}

function cast_loading_screen(state) {
  if (loading_screen) {
    if (state) {
      loading_screen.classList.add("on");
    } else {
      loading_screen.classList.remove("on");
    }
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
    //lazyloadImages = document.querySelectorAll(".image");
    lazyloadImages = document.getElementsByTagName("img");

    let imageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let image = entry.target;

          if (image.dataset.src) {
            image.src = image.dataset.src;
            image.dataset.src = "";
            track_network_usage(image.src);
          } else if (debug) {
            console.error(
              "No 'data-src' attribute found on the image element."
            );
          }

          image.classList.remove(".lazy");
          imageObserver.unobserve(image);
          // image.src = image.dataset.src;
          // console.log("I can see:", image.dataset.src);
        }
      });
    });
    /*
    lazyloadImages.forEach(function (image) {p
      imageObserver.observe(image);
    });
    */
    Array.from(lazyloadImages).forEach(function (image) {
      imageObserver.observe(image);
    });
  }
}

async function show_reader(args) {
  if (!args?.file || !args?.title) {
    return;
  }

  if (args?.draft) {
    notify({
      message: `"${args?.title}" is still in the works, check back soon!`,
      timeout: 10,
    });
    return;
  }

  try {
    cast_loading_screen(true); // need a way to get the state of loading screen in case something in the code stalls it or something

    const response = await fetch(`../posts/${args?.file + ".md"}`);
    const markdown = await response.text();
    const result = converter.makeHtml(markdown);

    track_network_usage(result);

    reading_window.style.display = "block";
    reading_content.innerHTML = `<h1>${args?.title}</h1>` + result;

    // LAZY LOADING for the post images
    const post_images = reading_content.getElementsByTagName("img");
    Array.from(post_images).forEach(function (image) {
      var originalText = image.src;
      var searchText = "media/";
      var index = originalText.indexOf(searchText);
      if (index !== -1) {
        var result = originalText.substring(index + searchText.length);
        image.dataset.src = "posts/media/" + result;
        debug && console.log(image.dataset.src);
        image.src = "";
      } else {
        console.log("Text 'media/' not found.");
      }
    });
    lazyload();

    CURRENT_POST = args?.title;

    recommended_content.innerHTML = "";
    if (args?.recommended) {
      args?.recommended.forEach(function (recommendation) {
        find_in_JSON(recommendation) // find entry
          .then((recommended_entry) => {
            const a = document.createElement("a");
            a.textContent = "#" + recommended_entry.title;
            a.addEventListener("click", async () => {
              show_reader(recommended_entry);
            });
            recommended_content.appendChild(a);
          })
          .catch((error) => {
            console.error("An error occurred:", error);
          });
      });
    }

    reading_content.scrollTop = 0; // whoops should've added this sooner

    cast_loading_screen(false);

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

async function find_in_JSON(target) {
  try {
    const entries_json = await fetch("entries.json");
    const entries_data = await entries_json.json();

    for (let i = 0; i < entries_data.length; i++) {
      const entry = entries_data[i];
      if (entry.file === target) {
        return entry;
      }
    }
  } catch (error) {
    console.error("Error fetching JSON file:", error);
  }
}

async function load_changelog() {
  try {
    const site_json = await fetch("site.json");
    const site_data = await site_json.json();

    const table = document
      .getElementById("changelog_table")
      .getElementsByTagName("tbody")[0];

    const changelog = site_data[1].changelog;
    for (let date in changelog) {
      if (changelog.hasOwnProperty(date)) {
        const newRow = table.insertRow();
        newRow.insertCell(0).textContent = dayjs(date).fromNow();
        newRow.insertCell(1).textContent = changelog[date];
      }
    }
  } catch (error) {
    console.error("Error fetching JSON file:", error);
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
      // console.log(item.title, dayjs(item.date).fromNow()); // y, m, d

      if (item.tn) {
        tn.dataset.src = `../assets/thumbnails/${item.tn}`;
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
  // copyright = document.getElementById("copyright");
  loading_screen = document.getElementById("loading-screen");
  recommended_content = document.getElementById("recommended_content");

  cast_loading_screen(true);

  reading_window.style.display = "none";

  /*
  if (isMobileDevice()) {
    alert(
      "The content of this website may be displayed incorrectly; it is highly recommended to view this website on larger screen"
    );
  }
  */

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
        file: "uncopyright",
        title: "Uncopyright",
      });
    });

  document
    .getElementById("btn_view_credits")
    .addEventListener("click", (event) => {
      event.preventDefault();

      show_reader({
        file: "credit",
        title: "Credits",
      });
    });

  document
    .getElementById("random_post")
    .addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const entries_json = await fetch("entries.json");
        const entries_data = await entries_json.json();

        const random_entry =
          entries_data[Math.floor(Math.random() * entries_data.length)];

        show_reader({
          file: random_entry.file,
          title: random_entry.title,
          draft: random_entry.draft,
        });
      } catch (error) {
        console.error("Error fetching JSON file:", error);
      }
    });

  document.getElementById("disclaimer").addEventListener("click", (event) => {
    event.preventDefault();

    show_reader({
      file: "disclaimer",
      title: "Disclaimer",
    });
  });

  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Escape":
        reading_window.style.display = "none";
        break;
      case "p":
        notify({
          message: `${total_network_usage.toFixed(2)} MB`,
          timeout: 2,
        });
        break;
      case "b":
        if (debug) {
          remove_blur();
        }
        break;
    }
  });

  window.addEventListener("resize", function () {
    lazyload();
    if (debug && isMobileDevice()) {
      if (!cd) {
        notify({
          message: "Adapted resolution for mobile",
          timeout: 2,
        });
        cooldown(5000);
      }
    }
  });

  await load_dynamic_categories();
  // await load_changelog();
  if (isMobileDevice()) {
    remove_blur();
  }
  lazyload();
  cast_loading_screen(false);
  fade_elements_in({
    div: "facts",
    tag: "p",
  });
});
