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
let layout;

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

async function load_dynamic_categories(target_category) {
  try {
    dynamic_content.innerHTML = "";

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

      if (target_category) {
        if (target_category != item.tag) {
          continue;
        }
      }

      const div = document.createElement("div");
      const date = document.createElement("div");
      const cat = document.createElement("div");
      const title = document.createElement("h1");
      const desc = document.createElement("p");
      const tn = document.createElement("img");
      const wc = document.createElement("p");
      const est_time = document.createElement("p");
      const tr_div = document.createElement("div");
      const tr_div_2 = document.createElement("div");

      div.classList.add("post_tile");
      tr_div.classList.add("row", "tr_div");
      tr_div_2.classList.add("row", "tr_div_2");
      // tn.classList.add("post_thumbnail");
      title.textContent = item.title;

      desc.textContent = item.description;

      date.classList.add("row");
      date.appendChild(
        document
          .getElementById("material-symbols:calendar-today-outline-rounded")
          .cloneNode(true)
      );

      date.appendChild(document.createTextNode(dayjs(item.date).fromNow()));

      cat.classList.add("row");
      cat.appendChild(
        document
          .getElementById("material-symbols:book-2-outline-rounded")
          .cloneNode(true)
      );

      cat.appendChild(document.createTextNode(item.tag));

      const response = await fetch(`../posts/${item.file + ".md"}`);
      const markdown = await response.text();
      const wordCount = markdown
        .replace(/[#*_>\-`[\]]+/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

      wc.textContent = `${wordCount} words`;
      est_time.textContent = `${Math.ceil(wordCount / 200)} minutes`;

      // console.log(item.title, dayjs(item.date).fromNow()); // y, m, d

      /*
      if (item.tn) {
        tn.dataset.src = `../assets/thumbnails/${item.tn}`;
        tn.classList.add("lazy", "image");
      }
      */

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

      tr_div.appendChild(date);
      tr_div.appendChild(cat);
      tr_div_2.appendChild(wc);
      tr_div_2.appendChild(est_time);

      div.appendChild(title);
      div.appendChild(tr_div);
      div.appendChild(desc);
      div.appendChild(tr_div_2);
      div.appendChild(tn);
      dynamic_content.appendChild(div);
    }
  } catch (error) {
    console.error("Error fetching JSON file:", error);
  }
}

async function load_tag_listings() {
  try {
    const entries_json = await fetch("entries.json");
    const entries_data = await entries_json.json();

    for (let i = 0; i < entries_data.length; i++) {
      const item = entries_data[i];

      if (!document.querySelector(`#${item.tag}`)) {
        const tag_btn = document.createElement("button");

        tag_btn.id = item.tag;
        tag_btn.textContent = item.tag;

        tag_btn.addEventListener("click", async () => {
          await load_dynamic_categories(item.tag);
        });

        document.getElementById("dynamic_tags").appendChild(tag_btn);
      }
    }
  } catch (error) {
    console.error("Error fetching JSON file:", error);
  }
}

function check_window_size() {
  if (isMobileDevice()) {
    layout.classList.remove("row");
  } else {
    layout.classList.add("row");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  dynamic_content = document.getElementById("dynamic_content");
  reading_window = document.getElementById("reading_window");
  reading_content = document.getElementById("reading_content");
  btn_reading_window_leave = document.getElementById(
    "btn_reading_window_leave"
  );
  layout = document.getElementById("layout");
  // copyright = document.getElementById("copyright");
  loading_screen = document.getElementById("loading-screen");
  recommended_content = document.getElementById("recommended_content");

  cast_loading_screen(true);

  check_window_size();

  reading_window.style.display = "none";

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

  document.getElementById("all").addEventListener("click", async () => {
    await load_dynamic_categories();
  });
  document.getElementById("about").addEventListener("click", async () => {
    show_reader({
      file: "about",
      title: "💫 About Me 💫",
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
    if (!cd) {
      check_window_size();
      notify({
        message: "Adapted resolution for mobile",
        timeout: 2,
      });
      cooldown(500);
    }
  });

  await load_dynamic_categories();
  await load_tag_listings();
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
