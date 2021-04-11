// ==UserScript==
// @name         Refined Gmail
// @description  Compose in New Windows, App Badge for Unread Emails, various styling refinements
// @version      1.5.6
// @author       Karl Horky
// @namespace    https://www.karlhorky.com/
// @match        https://mail.google.com/mail/u/*
// @grant        none
// ==/UserScript==

const eventMatchers = {
  HTMLEvents: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
  MouseEvents: /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/,
};

function dispatchDocumentEvent(element, eventName, optionsParam = {}) {
  const options = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
    ...optionsParam,
  };

  let event;
  let eventType = null;

  for (const name in eventMatchers) {
    if (eventMatchers[name].test(eventName)) {
      eventType = name;
      break;
    }
  }

  if (!eventType)
    throw new SyntaxError(
      'Only HTMLEvents and MouseEvents interfaces are supported',
    );

  event = document.createEvent(eventType);

  if (eventType === 'HTMLEvents') {
    event.initEvent(eventName, options.bubbles, options.cancelable);
  } else {
    event.initMouseEvent(
      eventName,
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
      element,
    );
  }
  element.dispatchEvent(event);
}

const elementCallbacks = {};

// function waitForElement(selector) {
//   return new Promise((resolve, reject) => {
//     const interval = setInterval(checkForElementAndResolve, 300);

//     function checkForElementAndResolve() {
//       const element = document.querySelector(selector);

//       if (element) {
//         clearInterval(interval);
//         resolve(element);
//       }
//     }
//   });
// }

const clickInterceptorHtml =
  '<div compose-in-new-window-interceptor style="position:absolute; z-index: 1000; height:100%; width:100%;"></div>';

elementCallbacks['.T-I.J-J5-Ji.T-I-KE.L3'] = (composeButton) => {
  if (!composeButton.querySelector('[compose-in-new-window-interceptor]')) {
    // Add element to intercept click
    composeButton.innerHTML += clickInterceptorHtml;

    const clickInterceptor = composeButton.querySelector(
      '[compose-in-new-window-interceptor]',
    );

    // Use `pointerdown` to capture both touches and mouse clicks
    clickInterceptor.addEventListener('pointerdown', (event) => {
      event.stopPropagation();

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
};

function addShiftToClickWithDocumentEvent(element) {
  if (!element.querySelector('[compose-in-new-window-interceptor]')) {
    element.innerHTML += clickInterceptorHtml;
    element
      .querySelector('[compose-in-new-window-interceptor]')
      // Events other than `click` do not work here
      .addEventListener('click', (event) => {
        event.stopPropagation();
        // - Reply button does not accept normal `new MouseEvent()`
        // - Events other than `click` do not work here
        dispatchDocumentEvent(element, 'click', {
          shiftKey: true,
        });
      });
  }
}

// Reply button at top of thread
elementCallbacks['.T-I.J-J5-Ji.T-I-Js-IF.aaq.T-I-ax7.L3'] = (
  threadTopReplyButton,
) => {
  addShiftToClickWithDocumentEvent(threadTopReplyButton);
};

/*
  FIXME: Buggy, first fix before using
  function addShiftToMenuItemClickWithMouseEvent(
    menuItemElement,
    clickableElement,
  ) {
    if (!menuItemElement.querySelector('[compose-in-new-window-interceptor]')) {
      // Add element to intercept click
      menuItemElement.innerHTML += clickInterceptorHtml;
      const clickInterceptor = menuItemElement.querySelector(
        '[compose-in-new-window-interceptor]',
      );
      function handler(event) {
        event.stopPropagation();
        dispatchDocumentEvent(clickableElement, 'click', {
          shiftKey: true,
        });
      }
      // Both `mousedown` and `pointerdown` are required
      // on menu items for whatever reason
      clickInterceptor.addEventListener('mousedown', handler);
      clickInterceptor.addEventListener('pointerdown', handler);
    }
  }
  // Reply menu item at menu at top of thread
  elementCallbacks['.b7.J-M > .J-N:nth-child(1) > .J-N-Jz'] = (
    replyMenuItem,
  ) => {
    addShiftToMenuItemClickWithMouseEvent(
      replyMenuItem,
      document.querySelector('.Bu div.if .ams.bkH'),
    );
  };
  // Reply All menu item at menu at top of thread
  elementCallbacks['.b7.J-M > .J-N:nth-child(2) > .J-N-Jz'] = (
    replyAllMenuItem,
  ) => {
    addShiftToMenuItemClickWithMouseEvent(
      replyAllMenuItem,
      document.querySelector('.Bu div.if .ams.bkI'),
    );
  };
  // Forward menu item at menu at top of thread
  elementCallbacks['.b7.J-M > .J-N:nth-child(3) > .J-N-Jz'] = (
    forwardMenuItem,
  ) => {
    addShiftToMenuItemClickWithMouseEvent(
      forwardMenuItem,
      document.querySelector('.Bu div.if .ams.bkG'),
    );
  };
  */

// Reply All button at bottom of thread
elementCallbacks['.Bu div.if .ams.bkI'] = (threadBottomReplyAllButton) => {
  addShiftToClickWithDocumentEvent(threadBottomReplyAllButton);
};

// Reply button at bottom of thread
elementCallbacks['.Bu div.if .ams.bkH'] = (threadBottomReplyButton) => {
  addShiftToClickWithDocumentEvent(threadBottomReplyButton);
};

// Forward button at bottom of thread
elementCallbacks['.Bu div.if .ams.bkG'] = (threadBottomForwardButton) => {
  addShiftToClickWithDocumentEvent(threadBottomForwardButton);
};

// Click on the full screen / pop out button
// with the Shift key as soon as it appears
elementCallbacks['img.Hq.aUG'] = (fullScreenAndPopoutButton) => {
  setTimeout(() => {
    fullScreenAndPopoutButton.dispatchEvent(
      new MouseEvent('mouseup', { shiftKey: true }),
    );
  }, 150);
};

// Set the app badge with the number of unread emails in inbox
//
// https://web.dev/badging-api/
//
// To make this work with multiple Gmail accounts, create desktop apps
// using the web app manifest trick documented at the link below.
//
// You will want to use a Gmail URL with the slash at the end, such as:
// https://mail.google.com/mail/u/0/
//
// https://github.com/karlhorky/dotfiles/blob/master/tricks/gsuite-google-calendar-chrome-desktop-app-shortcut.md
elementCallbacks['.aim:first-child .aio.UKr6le'] = (inboxRowLeftMenu) => {
  const unreadEmailsCountContainer = inboxRowLeftMenu.querySelector('.bsU');

  if (!unreadEmailsCountContainer) {
    navigator.clearAppBadge().catch((err) => {
      console.error('Error: Failed to clear app badge!');
      console.error(err);
    });
    return;
  }

  const unreadEmailsCount = unreadEmailsCountContainer.innerText;
  navigator.setAppBadge(unreadEmailsCount).catch((err) => {
    console.error('Error: Failed to set app badge!');
    console.error(err);
  });
};

const elementCallbacksSelectors = Object.keys(elementCallbacks);

const runElementCallbacksScheduled = (() => {
  let scheduled = false;

  return function runElementCallbacks() {
    if (scheduled === true) return;

    scheduled = true;
    setTimeout(() => {
      elementCallbacksSelectors.forEach((selector) => {
        const element = document.querySelector(selector);

        if (
          // No element
          !element
          // Element not visible
          // ||element.offsetParent === null
        ) {
          return;
        }

        elementCallbacks[selector](element);
      });
      scheduled = false;
    }, 80);
  };
})();

// Create an observer instance linked to the callback function
const observer = new MutationObserver(runElementCallbacksScheduled);

// Start observing the target node for configured mutations
observer.observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true,
});

const rules = [
  // Wrap titles inside Gmail information cards which appear above emails,
  // in order to prevent email widths getting very large
  `.nH.qY .t1 { white-space: normal; }`,

  // Make sender column less wide (subject column is usually longer and more important)
  `.zA>.yX {
    flex-basis: 110px;
    max-width: 110px;
  }`,

  // Make date column less wide (subject column is usually longer and more important)
  `.zA>.xW { flex-basis: auto }`,

  // Remove excessive left padding on email contents
  `.hx .gE ~ div + div:last-child { margin-left: -63px; }`,
];


const styleEl = document.createElement('style');
document.body.appendChild(styleEl);
rules.forEach((rule) => styleEl.sheet.insertRule(rule));
