import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const bookmarkNoteElement = document.createElement("input"); // Added input element for note
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  // Set attributes for play and delete buttons
  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  // Set the note value entered by the user
  bookmarkNoteElement.className = "bookmark-note";
  bookmarkNoteElement.placeholder = "Add note...";
  bookmarkNoteElement.addEventListener("change", e => {
    bookmark.note = e.target.value;
  });

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(bookmarkNoteElement); // Append note input element
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks=[]) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }

  return;
};

const onPlay = async e => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const bookmarkNote = e.target.parentNode.parentNode.getElementsByClassName("bookmark-note")[0].value; // Get the note value
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
    note: bookmarkNote // Include note in the message
  });
};

const onDelete = async e => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime
  );

  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  const bookmarkNote = bookmarkElementToDelete.getElementsByClassName("bookmark-note")[0].value; // Get the note value

  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
    note: bookmarkNote // Include note in the message
  }, viewBookmarks);
};


const setBookmarkAttributes =  (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
  }
});

