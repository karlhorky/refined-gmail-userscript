// ==UserScript==
// @name         Gmail Compose in New Window
// @namespace    https://www.karlhorky.com/
// @version      1.0
// @description  Compose, Reply and Forward in New Windows
// @author       Karl Horky
// @match        https://mail.google.com/mail/u/*
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  function waitForElement(selector) {
    return new Promise((resolve, reject) => {
      const interval = setInterval(checkForElementAndResolve, 300);

      function checkForElementAndResolve() {
        const element = document.querySelector(selector);

        if (element) {
          clearInterval(interval);
          resolve(element);
        }
      }
    });
  }

  const composeButton = await waitForElement(".T-I.J-J5-Ji.T-I-KE.L3");
  if (composeButton) {
    // Add element to intercept click
    composeButton.innerHTML =
      'Compose<div style="position:absolute; height:100%; width:100%;"></div>';

    const clickInterceptor = composeButton.querySelector("div");

    // Use `mousedown` and `mouseup` instead of `click` for Gmail
    clickInterceptor.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      event.preventDefault();

      // Use `mousedown` and `mouseup` instead of `click` for Gmail
      // Source: https://stackoverflow.com/a/57512820/1268612
      composeButton.dispatchEvent(
        new MouseEvent("mousedown", { shiftKey: true })
      );

      setTimeout(() =>
        composeButton.dispatchEvent(
          new MouseEvent("mouseup", { shiftKey: true })
        )
      );
    });
  }
})();
