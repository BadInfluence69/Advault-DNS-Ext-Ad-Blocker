'use strict';

/**
 * @file content.js
 * @description Advault's content script for YouTube-specific ad blocking and DOM manipulation.
 * Works in conjunction with the background script's declarativeNetRequest rules
 * and the external Advault DNS/HTTP server.
 * Added functionality for ad detection, timestamping, page refresh, and video resume.
 */

// Import the Advault DOM utility library
// Make sure 'AdvaultDOM.js' is in the same directory or adjust the path accordingly.
import { Advault } from './AdvaultDOM.js';


// --- Configuration & Selectors ---
// Paths to extension resources
const YTP_CONFIG_PATH = 'data/YTP.json';

// Core selectors for identifying YouTube ad elements in the DOM.
let advaultAdSelectors = [
    // --- YouTube End Screen Selectors ---
    ".ytp-endscreen-content",          // The main container for all end screen elements
    ".ytp-player-content ytp-endscreen-content", // More specific if needed
    ".ytp-videowall-still",            // Individual video thumbnails on the end screen
    ".ytp-videowall-still-image",      // Image within the video thumbnail
    ".ytp-videowall-still-info",       // Info overlay on the video thumbnail
    ".ytp-subscribe-button-renderer",  // Subscribe button on the end screen
    ".ytp-ce-video",                   // End screen video elements (often includes recommended videos)
    ".ytp-ce-playlist",                // End screen playlist elements
    ".ytp-ce-channel",                 // End screen channel promotion elements
    ".ytp-ce-element",                 // A general class used for end screen elements
    ".ytp-scroll-track-element",       // Sometimes related to the scrollable parts of end screens
    "ytd-player-legacy-endscreen",     // A legacy element, might still exist for older videos
    "ytd-watch-next-compact-video-renderer.ytd-player-legacy-endscreen", // Another specific legacy selector
    "ytd-compact-video-renderer.ytd-player-legacy-endscreen", // Yet another legacy selector
    // This one is very effective for the entire end screen overlay:
    ".ytp-ce-element-show", // Often applied when the end screen elements become visible
    // Potential overlap with "cards" (which are info cards, not end screens, but can be annoying)
    ".ytp-cards-teaser",               // Info cards that pop up during the video
    ".ytp-cards-button",               // Button to expand info cards
    "ytd-ad-slot-renderer",            // Main ad slot element
    "ytd-companion-slot-renderer",     // Companion banner ads
    ".ad-showing",                     // Common class for active ads
    ".YTP-ad-player-overlay",          // Overlay over the video player during ads
    ".video-ads",                      // Container for video ads
    "div[class*='ad-overlay']",        // Generic ad overlay divs
    ".ytp-ad-skip-button",
    ".YTP-ad-text",
    ".ytp-ad-progress",
    "div[class*='ytp-ad-player-overlay']", // More specific ad overlay containers
    "yt-mealbar-promo-renderer",       // Promotional meal bar (bottom of video)
    "ytd-promoted-sparkles-text-search-renderer", // Promoted search results
    "ytd-promoted-video-renderer",     // Promoted video suggestions
    ".ytp-ad-module",                  // General ad module
    ".ytp-ad-preview-container",       // Ad preview container
    ".ytp-ad-player-overlay-skip-or-preview", // Skip/preview button overlay
    "#player-ads",                     // Ads element within the player
    ".ad-container",                   // Generic ad container
    ".ad-interrupting",                // Ad interrupting the video
    ".ytp-ad-message-container",       // Ad message container
    ".ytp-paid-content-overlay",       // Paid content overlay
    ".ytp-ad-player-instream-ad-slot", // In-stream ad slot
    "ytd-ad-slot-renderer",                    // Main ad slot element
    "ytd-companion-slot-renderer",             // Companion banner ads
    ".ad-showing",                             // Common class for active ads
    ".YTP-ad-player-overlay",                  // Overlay over the video player during ads
    ".video-ads",                              // Container for video ads
    "div[class*='ad-overlay']",                // Generic ad overlay divs
    ".ytp-ad-skip-button",                     // Skip ad button
    ".YTP-ad-text",                            // Ad text overlay
    ".ytp-ad-progress",                        // Ad progress bar
    "div[class*='ytp-ad-player-overlay']",     // Specific ad overlay containers
    "yt-mealbar-promo-renderer",               // Promotional meal bar (bottom of video)
    "ytd-promoted-sparkles-text-search-renderer", // Promoted search results
    "ytd-promoted-video-renderer",             // Promoted video suggestions
    ".ytp-ad-module",                          // General ad module
    ".ytp-ad-preview-container",               // Ad preview container
    ".ytp-ad-player-overlay-skip-or-preview",  // Skip/preview button overlay
    "#player-ads",                             // Ads element within the player
    ".ad-container",                           // Generic ad container
    ".ad-interrupting",                        // Ad interrupting the video
    ".ytp-ad-message-container",               // Ad message container
    ".ytp-paid-content-overlay",               // Paid content overlay
    ".ytp-ad-player-instream-ad-slot",         // In-stream ad slot
    ".ytp-ad-overlay-container",               // Overlay container for ads
    ".ytp-ad-overlay-image",                   // Image overlay in ads
    ".ytp-ad-overlay-close-button",            // Close button for overlay ads
    ".ytp-ad-overlay-slot",                    // Slot for overlay ads
    ".ytp-ad-overlay-title",                   // Title in overlay ads
    ".ytp-ad-overlay-text",                    // Text in overlay ads
    ".ytp-ad-overlay-image-layout",            // Layout for image overlay ads
    ".ytp-ad-overlay-companion",               // Companion overlay ads
    ".ytp-ad-overlay-companion-slot",          // Slot for companion overlay ads
    ".ytp-ad-overlay-companion-close-button",  // Close button for companion overlay ads
    ".ytp-ad-overlay-companion-title",         // Title for companion overlay ads
    ".ytp-ad-overlay-companion-text",          // Text for companion overlay ads
    ".ytp-ad-overlay-companion-image",         // Image in companion overlay ads
    ".ytp-ad-overlay-companion-layout",        // Layout for companion overlay ads
    ".ytp-ad-overlay-companion-container",     // Container for companion overlay ads
    ".ytp-ad-overlay-companion-background",    // Background for companion overlay ads
    ".ytp-ad-overlay-companion-foreground",    // Foreground for companion overlay ads
    ".ytp-ad-overlay-companion-border",        // Border for companion overlay ads
    ".ytp-ad-overlay-companion-shadow",        // Shadow for companion overlay ads
    ".ytp-ad-overlay-companion-icon",          // Icon in companion overlay ads
    ".ytp-ad-overlay-companion-button",        // Button in companion overlay ads
    ".ytp-ad-overlay-companion-link",          // Link in companion overlay ads
    ".ytp-ad-overlay-companion-label",         // Label in companion overlay ads
    ".ytp-ad-overlay-companion-description",   // Description in companion overlay ads
    ".ytp-ad-overlay-companion-footer",        // Footer in companion overlay ads
    ".ytp-ad-overlay-companion-header",        // Header in companion overlay ads
    ".ytp-ad-overlay-companion-title-text",    // Title text in companion overlay ads
    ".ytp-ad-overlay-companion-subtitle",      // Subtitle in companion overlay ads
    ".ytp-ad-overlay-companion-caption",       // Caption in companion overlay ads
    ".ytp-ad-overlay-companion-note",          // Note in companion overlay ads
    ".ytp-ad-overlay-companion-alert",         // Alert in companion overlay ads
    ".ytp-ad-overlay-companion-warning",       // Warning in companion overlay ads
    ".ytp-ad-overlay-companion-info",          // Info in companion overlay ads
    ".ytp-ad-overlay-companion-success",       // Success message in companion overlay ads
    ".ytp-ad-overlay-companion-error",         // Error message in companion overlay ads
    ".ytp-ad-overlay-companion-loading",       // Loading indicator in companion overlay ads
    ".ytp-ad-overlay-companion-spinner",       // Spinner in companion overlay ads
    ".ytp-ad-overlay-companion-progress",      // Progress bar in companion overlay ads
    ".ytp-ad-overlay-companion-timer",         // Timer in companion overlay ads
    ".ytp-ad-overlay-companion-countdown",     // Countdown in companion overlay ads
    ".ytp-ad-overlay-companion-close-icon",    // Close icon in companion overlay ads
    ".ytp-ad-overlay-companion-dismiss",       // Dismiss button in companion overlay ads
    ".ytp-ad-overlay-companion-action",        // Action button in companion overlay ads
    ".ytp-ad-overlay-companion-cta",           // Call-to-action in companion overlay ads
    ".ytp-ad-overlay-companion-link-button",   // Link button in companion overlay ads
    ".ytp-ad-overlay-companion-play-button",   // Play button in companion overlay ads
    ".ytp-ad-overlay-companion-pause-button",  // Pause button in companion overlay ads
    ".ytp-ad-overlay-companion-replay-button", // Replay button in companion overlay ads
    ".ytp-ad-overlay-companion-skip-button",   // Skip button in companion overlay ads
    ".ytp-ad-overlay-companion-learn-more",    // Learn more link in companion overlay ads
    ".ytp-ad-overlay-companion-shop-now",      // Shop now link in companion overlay ads
    ".ytp-ad-overlay-companion-download",      // Download link in companion overlay ads
    ".ytp-ad-overlay-companion-install",       // Install link in companion overlay ads
    ".ytp-ad-overlay-companion-subscribe",     // Subscribe link in companion overlay ads
    ".ytp-ad-overlay-companion-signup",        // Signup link in companion overlay ads
    ".ytp-ad-overlay-companion-register",      // Register link in companion overlay ads
    ".ytp-ad-overlay-companion-join",          // Join link in companion overlay ads
    ".ytp-ad-overlay-companion-visit",         // Visit link in companion overlay ads
    ".ytp-ad-overlay-companion-contact",       // Contact link in companion overlay ads
    ".ytp-ad-overlay-companion-support",       // Support link in companion overlay ads
    ".ytp-ad-overlay-companion-help",          // Help link in companion overlay ads
    ".ytp-ad-overlay-companion-feedback",      // Feedback link in companion overlay ads
    ".ytp-ad-overlay-companion-survey",        // Survey link in companion overlay ads
    ".ytp-ad-overlay-companion-review",        // Review link in companion overlay ads
    ".ytp-ad-overlay-companion-rating",        // Rating link in companion overlay ads
    ".ytp-ad-overlay-companion-testimonial",   // Testimonial link in companion overlay ads
    ".ytp-ad-overlay-companion-case-study",    // Case study link in companion overlay ads
    ".ytp-ad-overlay-companion-whitepaper",    // Whitepaper link in companion overlay ads
    ".ytp-ad-overlay-companion-ebook",         // Ebook link in companion overlay ads
    ".ytp-ad-overlay-companion-guide",         // Guide link in companion overlay ads
    ".ytp-ad-overlay-companion-report",        // Report link in companion overlay ads
    ".ytp-ad-overlay-companion-newsletter",    // Newsletter link in companion overlay ads
    ".ytp-ad-overlay-companion-blog",          // Blog link in companion overlay ads
    ".ytp-ad-overlay-companion-article",       // Article link in companion overlay ads
    ".ytp-ad-overlay-companion-press-release", // Press release link in companion overlay ads
    ".ytp-ad-overlay-companion-announcement",  // Announcement link in companion overlay ads
    ".ytp-ad-overlay-companion-event",         // Event link in companion overlay ads
    ".ytp-ad-overlay-companion-webinar",       // Webinar link in companion overlay ads
    ".ytp-ad-overlay-companion-demo",          // Demo link in companion overlay ads
    ".ytp-ad-overlay-companion-trial",         // Trial link in companion overlay ads
    ".ytp-ad-overlay-companion-offer",         // Offer link in companion overlay ads
    ".ytp-ad-overlay-companion-coupon",        // Coupon link in companion overlay ads
    ".ytp-ad-overlay-companion-promo",         // Promo link in companion overlay ads
    ".ytp-ad-overlay-companion-deal",          // Deal link in companion overlay ads
    ".ytp-ad-overlay-companion-discount",      // Discount link in companion overlay ads
    ".ytp-ad-overlay-companion-sale",          // Sale link in companion overlay ads
    ".ytp-ad-overlay-companion-clearance",     // Clearance link in companion overlay ads
    ".ytp-ad-overlay-companion-bundle",        // Bundle link in companion overlay ads
    ".ytp-ad-overlay-companion-package",       // Package link in companion overlay ads
    ".ytp-ad-overlay-companion-subscription",  // Subscription link in companion overlay ads
    ".ytp-ad-overlay-companion-membership",    // Membership link in companion overlay ads
    ".ytp-ad-overlay-companion-plan",          // Plan link in companion overlay ads
    ".ytp-ad-overlay-companion-pricing",       // Pricing link in companion overlay ads
    ".ytp-ad-overlay-companion-quote",         // Quote link in companion overlay ads
    ".ytp-ad-overlay-companion-estimate",      // Estimate link in companion overlay ads
    ".ytp-ad-overlay-companion-calculator",    // Calculator link in companion overlay ads
    ".ytp-ad-overlay-companion-tool",          // Tool link in companion overlay ads
    ".ytp-ad-overlay-companion-block",         // Ad block
    ".ytp-ad-overlay-companion-resource",      // Resource link in companion overlay ads
];

// Selectors for key YouTube video player elements
const ADV_PLAYER_SELECTOR = '.html5-video-player';
const ADV_VIDEO_ELEMENT_SELECTOR = 'video';

// Storage key for video timestamp
const TIMESTAMP_STORAGE_KEY = 'advault_video_timestamp';
const VIDEO_URL_STORAGE_KEY = 'advault_video_url';

// --- Utility Functions (Leveraging Advault.DOM) ---

/**
 * Advault-specific function to load a JSON file from the extension's bundled resources.
 * @param {string} path - The path to the resource, relative to the extension's root.
 * @returns {Promise<object|null>} The parsed JSON object or null if loading fails.
 */
async function loadAdvaultResource(path) {
    try {
        const resourceURL = chrome.runtime.getURL(path);
        const response = await fetch(resourceURL);
        if (!response.ok) {
            throw new Error(`Advault: Failed to load resource '${path}': ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[Advault content.js] Error loading JSON resource from ${path}:`, error);
        return null;
    }
}

/**
 * Removes elements matching a set of CSS selectors from the DOM.
 * Utilizes Advault.DOM for robust element removal.
 * @param {string[]} selectors - An array of CSS selectors for elements to remove.
 * @param {string} logPrefix - A prefix for console messages.
 */
function removeAdvaultElements(selectors, logPrefix = '[Advault content.js] ') {
    let removedCount = 0;
    selectors.forEach(selector => {
        const elements = Advault.queryAll(selector); // Use Advault.queryAll
        elements.forEach(element => {
            try {
                Advault.DOM.remove(element); // Use Advault.DOM.remove
                console.debug(`${logPrefix}Removed element with selector: '${selector}'`);
                removedCount++;
            } catch (error) {
                console.error(`${logPrefix}Error removing ad elements with selector: '${selector}'`, error);
            }
        });
    });
    return removedCount > 0; // Return true if any elements were removed
}

/**
 * Checks if an ad is currently present on the page based on DOM selectors.
 * @returns {boolean} True if an ad element is found, false otherwise.
 */
function isAdPresent() {
    return advaultAdSelectors.some(selector => Advault.query(selector) !== null);
}

/**
 * Saves the current video timestamp and URL to Chrome's local storage.
 * @param {HTMLVideoElement} videoElement - The video element.
 */
async function saveVideoTimestamp(videoElement) {
    if (videoElement && videoElement.currentTime > 0) {
        const url = window.location.href;
        await chrome.storage.local.set({
            [TIMESTAMP_STORAGE_KEY]: videoElement.currentTime,
            [VIDEO_URL_STORAGE_KEY]: url
        });
        console.log(`[Advault content.js] Saved timestamp: ${videoElement.currentTime}s for URL: ${url}`);
    }
}

/**
 * Retrieves and applies the stored video timestamp if the URL matches.
 * @param {HTMLVideoElement} videoElement - The video element to seek.
 */
async function resumeVideoPlayback(videoElement) {
    if (!videoElement) {
        console.warn("[Advault content.js] Video element not found to resume playback.");
        return;
    }

    const data = await chrome.storage.local.get([TIMESTAMP_STORAGE_KEY, VIDEO_URL_STORAGE_KEY]);
    const storedTimestamp = data[TIMESTAMP_STORAGE_KEY];
    const storedUrl = data[VIDEO_URL_STORAGE_KEY];
    const currentUrl = window.location.href;

    if (storedTimestamp && storedUrl && currentUrl.includes(storedUrl.split('&t=')[0].split('?t=')[0])) { // Compare base URLs
        // Wait for video to be ready for seeking
        videoElement.oncanplaythrough = () => {
            if (videoElement.readyState >= 3) { // Enough data to play through
                videoElement.currentTime = storedTimestamp;
                videoElement.play().catch(e => console.error("[Advault content.js] Error resuming video playback:", e));
                console.log(`[Advault content.js] Resumed video from timestamp: ${storedTimestamp}s`);
                // Clear storage after successful resume
                chrome.storage.local.remove([TIMESTAMP_STORAGE_KEY, VIDEO_URL_STORAGE_KEY]);
                console.log("[Advault content.js] Cleared stored timestamp.");
            }
        };

        // If video is already ready (e.g., cached), trigger manually
        if (videoElement.readyState >= 3) {
            videoElement.oncanplaythrough();
        }
    } else {
        console.log("[Advault content.js] No relevant timestamp found or URL mismatch.");
    }
}


// --- Mutation Observer Callback ---
const advaultObserverCallback = (mutationsList, observer) => {
    let playerElement = Advault.query(ADV_PLAYER_SELECTOR);
    let videoElement = Advault.query(ADV_VIDEO_ELEMENT_SELECTOR);

    // Re-check for player if it seems to have disappeared
    if (!playerElement) {
        console.debug('[Advault content.js] YouTube player not found, re-checking...');
        playerElement = Advault.query(ADV_PLAYER_SELECTOR);
        videoElement = Advault.query(ADV_VIDEO_ELEMENT_SELECTOR); // Re-query video element as well
    }

    if (playerElement) {
        // Aggressively remove known ad elements whenever DOM changes
        const adsRemoved = removeAdvaultElements(advaultAdSelectors);

        // Ensure player and video remain visible if they were manipulated by ad scripts
        Advault.DOM.prop(playerElement, 'style.display', 'block');
        Advault.DOM.prop(videoElement, 'style.display', 'block');

        // Check for ad presence and refresh if detected
        if (isAdPresent()) {
            console.warn("[Advault content.js] 🚨 Ad detected! Attempting to refresh page and save timestamp...");
            if (videoElement) {
                saveVideoTimestamp(videoElement);
            }
            // Trigger a full page reload to clear ads
            window.location.reload(true);
            observer.disconnect(); // Disconnect observer to prevent re-triggering during reload
        }
    }
};

// --- Main Execution Logic ---
(async function initAdvaultContentScript() {
    console.log("[Advault content.js] 🚀 YouTube-specific AdBlocker injected!");

    // Load YouTube-specific configuration from YTP.json
    const ytpConfig = await loadAdvaultResource(YTP_CONFIG_PATH);
    if (ytpConfig) {
        console.log("[Advault content.js] Loaded YTP.json config:", ytpConfig);

        if (Array.isArray(ytpConfig.selectors)) {
            // Add dynamically loaded selectors to our main list
            advaultAdSelectors.push(...ytpConfig.selectors);
            console.log("[Advault content.js] Added YouTube specific selectors from YTP.json.");
        }
        if (ytpConfig.message) {
            console.log(`[Advault content.js] YTP Message: ${ytpConfig.message}`);
        }
    } else {
        console.warn("[Advault content.js] YTP.json could not be loaded. Running with default Advault selectors.");
    }

    // Initialize Mutation Observer to watch for DOM changes and remove ads
    const observer = new MutationObserver(advaultObserverCallback);
    // Observe the entire document for changes, including subtree modifications
    observer.observe(document.documentElement, {
        childList: true,   // Observe direct children additions/removals
        subtree: true,     // Observe all descendants
        attributes: true   // Observe attribute changes (e.g., style, class)
    });
    console.log("[Advault content.js] Mutation Observer initialized for ad removal.");

    // Attempt to resume video playback immediately after page load if a timestamp exists
    const videoElementOnLoad = Advault.query(ADV_VIDEO_ELEMENT_SELECTOR);
    if (videoElementOnLoad) {
        // Use a slight delay to ensure the player is fully initialized
        setTimeout(() => resumeVideoPlayback(videoElementOnLoad), 1000);
    } else {
        // If video element isn't immediately available, wait for it to appear
        const playerObserver = new MutationObserver((mutations, obs) => {
            const video = Advault.query(ADV_VIDEO_ELEMENT_SELECTOR);
            if (video) {
                setTimeout(() => resumeVideoPlayback(video), 500);
                obs.disconnect(); // Disconnect once video is found
            }
        });
        playerObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    // --- Aggressive Video Ad Management (Use with caution - experimental) ---
    // This part attempts to skip/manage video ads directly in the player.
    // While powerful, it can be fragile and might break legitimate video playback.
    // The Python DNS server's "fake playback" via DNS resolution is generally more robust for video ads.
    setInterval(() => {
        const videoElement = Advault.query(ADV_VIDEO_ELEMENT_SELECTOR);
        if (videoElement && !videoElement.paused && !videoElement.ended && videoElement.duration > 0) {

            // Attempt to click the skip button if available
            const skipButton = Advault.query(".ytp-ad-skip-button");
            if (skipButton) {
                skipButton.click();
                console.log("[Advault content.js] ⏭ Attempted to skip ad via button click!");
                return; // Ad potentially skipped, no need for further checks
            }

            // More aggressive tactics (uncomment and test if needed)
            // Example: Try to fast-forward if a short ad is detected (highly heuristic)
            // if (videoElement.currentTime < 5 && videoElement.duration > 15 && videoElement.duration < 60) {
            //      videoElement.currentTime = videoElement.duration;
            //      console.log("[Advault content.js] ⏩ Fast-forwarded short ad!");
            // }

            // Example: If a detected ad is playing, set playback speed higher to rush through
            // You'd need a more reliable way to detect "ad playing" state.
            // if (Advault.DOM.has(videoElement, 'ytp-ad-playing')) { // Hypothetical class for ad state
            //      videoElement.playbackRate = 16; // Max speed
            //      console.log("[Advault content.js] ⚡️ Increased playback speed for ad!");
            // } else {
            //      videoElement.playbackRate = 1; // Reset to normal for content
            // }

            // The following `removeAttribute("src")` and `load()` can be very disruptive
            // and should be used as a last resort, as they often break video playback.
            // if (videoElement.src && videoElement.src.includes('googlesyndication.com')) {
            //      videoElement.removeAttribute("src");
            //      videoElement.load();
            //      console.log("[Advault content.js] 🛑 Blocked Video Ad Injection by clearing source!");
            // }
        }
    }, 500); // Check every 0.5 seconds for video ad elements

    console.log("[Advault content.js] 🎉 Advault YouTube Ad Blocking Initialized!");

})(); // End of Advault content script IIFE