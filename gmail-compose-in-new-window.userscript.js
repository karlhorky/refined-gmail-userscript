/* global globalThis */

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
  // eslint-disable-next-line strict
  'use strict';

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

  const clickInterceptorHtml =
    '<div style="position:absolute; height:100%; width:100%;"></div>';

  const composeButton = await waitForElement('.T-I.J-J5-Ji.T-I-KE.L3');
  if (composeButton) {
    // Add element to intercept click
    composeButton.innerHTML += clickInterceptorHtml;

    const clickInterceptor = composeButton.querySelector('div');

    // Use `pointerdown` to capture both touches and mouse clicks
    clickInterceptor.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      event.preventDefault();

      // Use `mousedown` and `mouseup` instead of `click` for Gmail
      // Source: https://stackoverflow.com/a/57512820/1268612
      composeButton.dispatchEvent(
        new MouseEvent('mousedown', { shiftKey: true }),
      );

      setTimeout(() =>
        composeButton.dispatchEvent(
          new MouseEvent('mouseup', { shiftKey: true }),
        ),
      );
    });
  }

  const originalOpen = globalThis.XMLHttpRequest.prototype.open;

  // TODO: Use mutation observer instead of XHR monkey patching
  // to improve speed and reliability (handler not registered
  // when Reply button is recreated after closing pop-up and
  // trashing the old reply)
  globalThis.XMLHttpRequest.prototype.open = function open(method, url) {
    const isThreadViewRequest =
      method === 'POST' &&
      url
        .split('/')
        .pop()
        .match(/s\?hl=en&c=\d+/);
    if (!isThreadViewRequest) console.log(url);

    if (isThreadViewRequest) {
      const replyButton = document.querySelector('.Bu div.if .ams.bkH');
      const forwardButton = document.querySelector('.Bu div.if .ams.bkG');

      if (!replyButton.querySelector('div')) {
        // TODO: Also check for visibility?
        // document.querySelector('.Bu div.if .ams.bkH').offsetParent !== null
        replyButton.innerHTML += clickInterceptorHtml;
        replyButton.querySelector('div').addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();

          // Reply button does not accept normal `new MouseEvent()`
          const options = {
            pointerX: 0,
            pointerY: 0,
            button: 0,
            ctrlKey: false,
            altKey: false,
            shiftKey: true,
            metaKey: false,
            bubbles: true,
            cancelable: true,
          };
          const newEvent = document.createEvent('MouseEvents');
          newEvent.initMouseEvent(
            'click',
            options.bubbles,
            options.cancelable,
            document.defaultView,
            options.button,
            options.pointerX,
            options.pointerY,
            options.pointerX,
            options.pointerY,
            options.ctrlKey,
            options.altKey,
            options.shiftKey,
            options.metaKey,
            options.button,
            replyButton,
          );

          replyButton.dispatchEvent(newEvent);

          // TODO: Use mutation observer instead of setTimeout
          // to improve performance and reliability
          setTimeout(() => {
            document
              .querySelector('img.Hq.aUG')
              .dispatchEvent(new MouseEvent('mouseup', { shiftKey: true }));
          }, 1500);
        });
      }
      // Reply button
      //console.log(document.querySelector('.Bu div.if .ams.bkH').offsetParent !== null);
      // Forward button
      //console.log(document.querySelector('.Bu div.if .ams.bkG').offsetParent !== null);
    }

    return originalOpen.apply(this, arguments);
  };
})();
