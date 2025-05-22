'use strict';

/**
 * @file AdvaultDOM.js
 * @description A lightweight DOM manipulation utility library for Advault.
 * Provides efficient methods for element selection, attribute/property management,
 * class manipulation, event handling, and more.
 */

/**
 * Global Advault Namespace.
 * All core Advault utilities will reside under this namespace to prevent global conflicts.
 * @namespace Advault
 */
const Advault = {};

/**
 * Normalizes a target into an array of DOM Elements.
 * This ensures all methods can consistently iterate over a collection of elements.
 * @param {string|Element|Element[]|NodeList|HTMLCollection|null} target - The element(s) to normalize.
 * @returns {Element[]} An array of DOM Elements.
 */
Advault.normalizeTarget = target => {
    if (typeof target === 'string') {
        // Use document.querySelectorAll for string selectors
        return Array.from(document.querySelectorAll(target));
    }
    if (target instanceof Element) {
        return [target]; // Already a single element
    }
    if (target === null || target === undefined) {
        return []; // Handle null/undefined targets gracefully
    }
    // If it's already an array-like structure (NodeList, HTMLCollection, Array), convert to Array
    if (Array.isArray(target) || (typeof target[Symbol.iterator] === 'function' && typeof target.length === 'number')) {
        return Array.from(target);
    }
    return []; // Fallback for unexpected types
};

/**
 * Creates a delegated event handler.
 * This allows attaching a single event listener to a parent element
 * and handling events for matching descendants.
 * @param {string} selector - The CSS selector for the descendant elements to target.
 * @param {function(Event): void} callback - The callback function to execute when a matching event occurs.
 * @returns {function(Event): void} The wrapped event handler.
 */
Advault.createDelegatedEventHandler = (selector, callback) => {
    return function(event) {
        const dispatcher = event.currentTarget; // The element the event listener is attached to
        const receiver = event.target;         // The element that originally triggered the event

        // Ensure dispatcher is a valid HTMLElement for DOM operations
        if (!(dispatcher instanceof HTMLElement)) {
            return;
        }

        // Use closest() to find the closest ancestor (including itself) that matches the selector.
        // This is the core of event delegation.
        const delegateTarget = receiver.closest(selector);

        // Check if a matching element was found *within* the dispatcher's subtree
        // and if it's the element we should trigger the callback on.
        // The original logic `ancestor === receiver` was too restrictive for delegation
        // as `closest` could return an ancestor, not necessarily the receiver itself.
        // The key is `dispatcher.contains(delegateTarget)` to ensure it's within the listening scope.
        if (delegateTarget && dispatcher.contains(delegateTarget)) {
            // Call the original callback with `this` bound to the matched delegatedTarget,
            // and pass the event object.
            callback.call(delegateTarget, event);
        }
    };
};

/**
 * A class for performing common DOM manipulations efficiently.
 * All methods are static to be called directly (e.g., `Advault.DOM.attr(...)`).
 * @class Advault.DOM
 */
Advault.DOM = class {
    /**
     * Gets or sets an attribute on target element(s).
     * @param {string|Element|Element[]} target - The element(s) to operate on.
     * @param {string} attrName - The name of the attribute.
     * @param {string|null} [value=undefined] - The value to set. If `undefined`, gets the attribute. If `null`, removes the attribute.
     * @returns {string|undefined} The attribute value if getting, otherwise `undefined`.
     */
    static attr(target, attrName, value = undefined) {
        const elements = Advault.normalizeTarget(target);
        if (elements.length === 0) return undefined;

        if (value === undefined) {
            // Get the attribute value from the first element
            return elements[0].getAttribute(attrName);
        }

        // Set or remove attribute on all elements
        for (const elem of elements) {
            if (value === null) {
                elem.removeAttribute(attrName);
            } else {
                elem.setAttribute(attrName, value);
            }
        }
    }

    /**
     * Removes all child nodes from target element(s).
     * This is a faster alternative to `innerHTML = ''`.
     * @param {string|Element|Element[]} target - The element(s) to clear.
     */
    static clear(target) {
        for (const elem of Advault.normalizeTarget(target)) {
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }
    }

    /**
     * Creates a deep clone of the first target element.
     * @param {string|Element|Element[]} target - The element(s) to clone.
     * @returns {Element|null} A cloned element, or `null` if no target.
     */
    static clone(target) {
        const elements = Advault.normalizeTarget(target);
        return elements.length > 0 ? elements[0].cloneNode(true) : null;
    }

    /**
     * Creates a new HTML element.
     * @param {string} tagName - The tag name of the element to create (e.g., 'div', 'span').
     * @returns {Element} The newly created element.
     * @throws {Error} If `tagName` is not a string.
     */
    static create(tagName) {
        if (typeof tagName !== 'string') {
            throw new Error('Advault.DOM.create: tagName must be a string.');
        }
        return document.createElement(tagName);
    }

    /**
     * Gets or sets a property on target element(s).
     * @param {string|Element|Element[]} target - The element(s) to operate on.
     * @param {string} propName - The name of the property.
     * @param {*} [value=undefined] - The value to set. If `undefined`, gets the property.
     * @returns {*} The property value if getting, otherwise `undefined`.
     */
    static prop(target, propName, value = undefined) {
        const elements = Advault.normalizeTarget(target);
        if (elements.length === 0) return undefined;

        if (value === undefined) {
            // Get the property value from the first element
            return elements[0][propName];
        }

        // Set property on all elements
        for (const elem of elements) {
            elem[propName] = value;
        }
    }

    /**
     * Gets or sets the text content of target element(s).
     * @param {string|Element|Element[]} target - The element(s) to operate on.
     * @param {string} [text=undefined] - The text to set. If `undefined`, gets the text.
     * @returns {string|undefined} The text content if getting, otherwise `undefined`.
     */
    static text(target, text = undefined) {
        const elements = Advault.normalizeTarget(target);
        if (elements.length === 0) return undefined;

        if (text === undefined) {
            // Get text content from the first element
            return elements[0].textContent;
        }

        // Set text content for all elements
        for (const elem of elements) {
            elem.textContent = text;
        }
    }

    /**
     * Removes target element(s) from the DOM.
     * @param {string|Element|Element[]} target - The element(s) to remove.
     */
    static remove(target) {
        for (const elem of Advault.normalizeTarget(target)) {
            elem.remove();
        }
    }

    /**
     * Empties target element(s) by removing all child elements (not text nodes).
     * @param {string|Element|Element[]} target - The element(s) to empty.
     */
    static empty(target) {
        for (const elem of Advault.normalizeTarget(target)) {
            while (elem.firstElementChild) {
                elem.firstElementChild.remove();
            }
        }
    }

    /**
     * Attaches an event listener to element(s). Supports event delegation.
     * @param {string|Element|Element[]|Window|Document} target - The element(s) to attach the listener to.
     * @param {string} type - The event type (e.g., 'click', 'mouseover').
     * @param {string|function(Event): void} subtargetOrCallback - If a string, a CSS selector for delegation. If a function, the direct callback.
     * @param {function(Event): void} [callbackIfDelegated] - The callback function if delegation is used.
     * @param {object|boolean} [options={ capture: true }] - Event listener options (e.g., { capture: true }, { once: true }).
     */
    static on(target, type, subtargetOrCallback, callbackIfDelegated, options) {
        let callbackToAttach;
        let eventOptions = options;

        if (typeof subtargetOrCallback === 'function') {
            // Direct event listener
            callbackToAttach = subtargetOrCallback;
            eventOptions = callbackIfDelegated; // `options` was passed as `callbackIfDelegated`
            if (typeof eventOptions === 'boolean') {
                eventOptions = { capture: eventOptions };
            }
        } else if (typeof subtargetOrCallback === 'string') {
            // Delegated event listener
            const selector = subtargetOrCallback;
            const originalCallback = callbackIfDelegated;
            callbackToAttach = Advault.createDelegatedEventHandler(selector, originalCallback);
            if (eventOptions === undefined || typeof eventOptions === 'boolean') {
                eventOptions = { capture: true }; // Default to capture for delegation
            } else {
                // Ensure capture is true for delegated events by default, or respect user's capture if explicitly false
                eventOptions.capture = eventOptions.hasOwnProperty('capture') ? eventOptions.capture : true;
            }
        } else {
            console.warn('Advault.DOM.on: Invalid arguments provided.');
            return;
        }

        // Normalize target for addEventListener
        const targets = (target instanceof Window || target instanceof Document)
            ? [target]
            : Advault.normalizeTarget(target);

        for (const elem of targets) {
            elem.addEventListener(type, callbackToAttach, eventOptions);
        }
    }

    /**
     * Removes an event listener from element(s).
     * @param {string|Element|Element[]|Window|Document} target - The element(s) to remove the listener from.
     * @param {string} type - The event type.
     * @param {function(Event): void} callback - The callback function to remove.
     * @param {object|boolean} [options={ capture: true }] - Event listener options (must match what was used in `on`).
     */
    static off(target, type, callback, options) {
        if (typeof callback !== 'function') {
            console.warn('Advault.DOM.off: Callback must be a function.');
            return;
        }
        if (typeof options === 'boolean') {
            options = { capture: options };
        } else if (options === undefined) {
             options = { capture: true }; // Default capture for removal as well for consistency
        }

        const targets = (target instanceof Window || target instanceof Document)
            ? [target]
            : Advault.normalizeTarget(target);

        for (const elem of targets) {
            elem.removeEventListener(type, callback, options);
        }
    }
};

/**
 * @class Advault.DOM.ClassList
 * @description Utility for managing CSS classes on DOM elements.
 */
Advault.DOM.ClassList = class {
    /**
     * Adds one or more class names to target element(s).
     * @param {string|Element|Element[]} target - The element(s) to modify.
     * @param {string|string[]} names - The class name(s) to add.
     */
    static add(target, ...names) {
        for (const elem of Advault.normalizeTarget(target)) {
            elem.classList.add(...names);
        }
    }

    /**
     * Removes one or more class names from target element(s).
     * @param {string|Element|Element[]} target - The element(s) to modify.
     * @param {string|string[]} names - The class name(s) to remove.
     */
    static remove(target, ...names) {
        for (const elem of Advault.normalizeTarget(target)) {
            elem.classList.remove(...names);
        }
    }

    /**
     * Toggles a class name on target element(s).
     * @param {string|Element|Element[]} target - The element(s) to modify.
     * @param {string} name - The class name to toggle.
     * @param {boolean} [state=undefined] - If `true`, adds the class; if `false`, removes it.
     * @returns {boolean|undefined} True if the class is now present, false otherwise.
     */
    static toggle(target, name, state = undefined) {
        let result;
        for (const elem of Advault.normalizeTarget(target)) {
            result = elem.classList.toggle(name, state);
        }
        // Returns the state of the *last* element processed, consistent with original
        return result;
    }

    /**
     * Checks if the first target element has a specific class name.
     * @param {string|Element|Element[]} target - The element(s) to check.
     * @param {string} name - The class name to check for.
     * @returns {boolean} True if the class is present on the first element, false otherwise.
     */
    static has(target, name) {
        const elements = Advault.normalizeTarget(target);
        if (elements.length === 0) return false;
        return elements[0].classList.contains(name);
    }
};

/**
 * @function Advault.query
 * @description Shorthand for `document.querySelector`.
 * @param {string} selector - The CSS selector string.
 * @param {Element} [context=document] - The element within which to search.
 * @returns {Element|null} The first matching element, or `null`.
 */
Advault.query = (selector, context = document) => {
    if (typeof selector !== 'string') {
        console.warn('Advault.query: Selector must be a string.');
        return null;
    }
    if (!(context instanceof Element || context instanceof Document)) {
        console.warn('Advault.query: Context must be an Element or Document.');
        return null;
    }
    return context.querySelector(selector);
};

/**
 * @function Advault.queryAll
 * @description Shorthand for `document.querySelectorAll`.
 * @param {string} selector - The CSS selector string.
 * @param {Element} [context=document] - The element within which to search.
 * @returns {NodeListOf<Element>} A NodeList of matching elements.
 */
Advault.queryAll = (selector, context = document) => {
    if (typeof selector !== 'string') {
        console.warn('Advault.queryAll: Selector must be a string.');
        return document.querySelectorAll(''); // Return empty NodeList
    }
    if (!(context instanceof Element || context instanceof Document)) {
        console.warn('Advault.queryAll: Context must be an Element or Document.');
        return document.querySelectorAll(''); // Return empty NodeList
    }
    return context.querySelectorAll(selector);
};

// Common HTML elements for easy access (branded as Advault.DOM)
Advault.DOM.root = Advault.query(':root');
Advault.DOM.html = document.documentElement;
Advault.DOM.head = document.head;
Advault.DOM.body = document.body;

// Export the Advault namespace for use in other modules
export { Advault };