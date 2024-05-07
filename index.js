import { isMobileDevice } from "../modules/device.js";
import { notify } from "../modules/notify.js";

var dynamic_content;
var reading_window;
var reading_content;
var btn_reading_window_leave;
var copyright;
var loading_screen;
var CURRENT_POST = "";

var msg_success = "[✔️] Success";
var msg_err = "[❌] Error";

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
    (async () => {
      const success = await show_reader(args);
      if (success) {
        // success
      }
    })();
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

document.addEventListener("DOMContentLoaded", () => {
  dynamic_content = document.getElementById("dynamic_content");
  reading_window = document.getElementById("reading_window");
  reading_content = document.getElementById("reading_content");
  btn_reading_window_leave = document.getElementById(
    "btn_reading_window_leave"
  );
  copyright = document.getElementById("copyright");
  loading_screen = document.getElementById("loading-screen");

  cast_loading_screen();

  fetch("site.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById(
        "build_date"
      ).textContent = `: ${data[0].last_build}`;
    })
    .catch((error) => {
      console.error("Error fetching JSON file:", error);
    });

  reading_window.style.display = "none";

  if (isMobileDevice()) {
    alert(
      "The content of this website may be displayed incorrectly; it is highly recommended to view this website on larger screen"
    );
  }

  fetch("entries.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((jsonData) => {
      jsonData.forEach((item) => {
        fetch(`../posts/${item.file}`)
          .then((response) => response.text())
          .then((markdown) => {
            check_URL_for_matching_post(item);

            var section;

            // if the section not already exist, create it
            if (!document.querySelector(`#${item.tag}`)) {
              const outer_section = document.createElement("div");
              const section_title = document.createElement("h1");

              outer_section.classList.add("post_section", "column");
              section_title.textContent = item.tag;
              outer_section.appendChild(section_title);

              section = document.createElement("div");

              section.id = item.tag;
              section.classList.add("post_section", "row");
              outer_section.appendChild(section);
              dynamic_content.appendChild(outer_section);
            } else {
              section = document.querySelector(`#${item.tag}`);
            }

            const div = document.createElement("div");
            const title = document.createElement("h1");
            const tn = document.createElement("img");

            div.classList.add("post_tile", "container", "outline");
            tn.classList.add("post_thumbnail");
            title.textContent = item.title;

            if (item.tn) {
              tn.src = `../assets/${item.tn}`;
            }

            if (item.draft) {
              title.style.color = "red";
            }

            div.addEventListener("click", () => {
              if (item.draft) {
                notify({
                  message: `"${item.title}" is still in the works, check back soon!`,
                  timeout: 10,
                });
              } else {
                (async () => {
                  const success = await show_reader(item);
                  if (success) {
                    // success
                  }
                })();
              }
            });

            div.appendChild(title);
            div.appendChild(tn);
            section.appendChild(div);
          })
          .catch((error) => {
            console.error("Error fetching Markdown file:", error);
          });
      });
    })
    .catch((error) => {
      console.error("Error fetching JSON file:", error);
    });

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
      (async () => {
        const success = await show_reader({
          file: "uncopyright.md",
          title: "Uncopyright",
        });
        if (success) {
          // success
        }
      })();
    });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      reading_window.style.display = "none";
    }
  });

  cast_loading_screen();
});
