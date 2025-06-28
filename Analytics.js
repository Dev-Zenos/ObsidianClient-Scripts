(function () {
  "use strict";

  console.log("[Game Logger is loaded]");

  let currentGameCode = null;
  function updateGameCodeFromUrl(pageUrl) {
    if (pageUrl.includes("/games/")) {
      const parts = pageUrl.split("~");
      currentGameCode = parts[parts.length - 1];
      console.log(`Game Code from URL: ${currentGameCode}`);
    } else {
      if (currentGameCode) {
        console.log("Left game");
        currentGameCode = null;
      }
    }
  }

  // --- Navigation Logging ---
  function logNavigation(url) {
    console.log(`Page navigated to:`, url);
    updateGameCodeFromUrl(url);
  }

  logNavigation("initial load", window.location.href);

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    const url = new URL(args[2], window.location.href).href;
    logNavigation(url);
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    const url = new URL(args[2], window.location.href).href;
    logNavigation(url);
    return result;
  };

  window.addEventListener("popstate", function () {
    logNavigation(window.location.href);
  });
})();
