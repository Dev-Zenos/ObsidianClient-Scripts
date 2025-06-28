(function () {
  "use strict";

  const { promises: fs } = require("fs");
  const { app, BrowserWindow } = require("electron");
  const path = require("path");

  let analyticsPath = path.join(
    app.getPath("documents"),
    "ObsidianClient",
    "clientdata",
    "analytics.json"
  );
  let currentGameCode = null;
  let joinTime = null;
  let analyticsWriteTimer = null;

  const loadAnalytics = async () => {
    let analyticsCache = null;
    try {
      const analyticsExist = await fs
        .access(analyticsPath)
        .then(() => true)
        .catch(() => false);
      analyticsCache = analyticsExist
        ? JSON.parse(await fs.readFile(analyticsPath, "utf8")) || {
            score: [],
            playtime: [],
          }
        : {
            score: [],
            playtime: [],
          };
      if (!analyticsExist)
        await fs.writeFile(analyticsPath, JSON.stringify(analyticsCache));
      return analyticsCache;
    } catch (err) {
      console.error("Error loading analytics:", err);
      analyticsCache = {
        score: [],
        playtime: [],
      };
      await fs.writeFile(analyticsPath, JSON.stringify(analyticsCache));
      return analyticsCache;
    }
  };

  const saveanalytics = async (analytics) => {
    let analyticsCache = await loadAnalytics();
    let date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const days = String(date.getDate()).padStart(2, "0");
    date = `${year}-${month}-${days}`;

    let day = analyticsCache.playtime.find((d) => d.date === date);
    if (!day) {
      day = {
        date: date,
        playtime: analytics.duration || 0,
        games: [analytics],
      };
      analyticsCache.playtime.push(day);
    } else {
      day.playime += analytics.duration || 0;
      day.games.push(analytics);
    }
    analytics.playtime = clearTimeout(analyticsWriteTimer);
    analyticsWriteTimer = setTimeout(
      () =>
        fs
          .writeFile(analyticsPath, JSON.stringify(analyticsCache))
          .catch((err) => console.error("Error saving analytics:", err)),
      500
    );
    console.log(`Analytics saved for game: ${analytics.gameCode}`);
  };

  console.log("[Game Logger is loaded]");
  function updateGameCodeFromUrl(pageUrl) {
    if (pageUrl.includes("/games/")) {
      const parts = pageUrl.split("~");
      currentGameCode = parts[parts.length - 1];
      joinTime = Date.now();
      console.log(`Game Code from URL: ${currentGameCode}`);
    } else {
      if (currentGameCode) {
        console.log("Left game");
        console.log(`Game Code: ${currentGameCode}`);
        const duration = Date.now() - joinTime;
        console.log(`Duration: ${duration} ms`);
        saveanalytics({
          gameCode: currentGameCode,
          duration: duration,
          date: new Date().toISOString(),
        }).catch((err) => console.error("Error saving analytics:", err));
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
