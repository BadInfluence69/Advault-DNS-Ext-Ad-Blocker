'use strict';

// *** CRITICAL DO NOT CHANGE ***
const ADVAULT_LIST_URL = "http://185.107.97.246:8080/full_blocklist.txt"; // Points to Advault's endpoint.
// **************************

const BLOCK_LIST_STORAGE_KEY = "blockedDomains"; // For caching the raw domains
const DNR_RULE_ID_OFFSET = 1; 

// Set up an alarm to regularly fetch and update the block list
// Use MINUTES, as the API expects minutes. 6 hours = 360 minutes
const UPDATE_INTERVAL_MINUTES = 6 * 60; // Every 6 hours

/**
 * Fetches the block list from AdVault, converts it to declarativeNetRequest rules,
 * and applies them dynamically.
 */
async function fetchAndApplyBlockList() {
  console.log("Attempting to fetch and apply block list from AdVault...");
  try {
    const response = await fetch(ADVAULT_LIST_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    // Split by newline and filter out empty lines or comments (starting with #)
    const rawDomains = text.split('\n')
                               .map(line => line.trim())
                               .filter(line => line.length > 0 && !line.startsWith('#'));

    // FIX: Corrected typo from 'Workspaceed' to 'Fetched'
    console.log(`Workspaceed ${rawDomains.length} domains from AdVault.`); // Corrected typo here

    // Convert raw domains to declarativeNetRequest rules
    const newRules = rawDomains.map((domain, index) => ({
      id: DNR_RULE_ID_OFFSET + index, // Unique ID for each rule
      priority: 1, // Lower numbers are higher priority, 1 is a good default
      action: { type: "block" }, // Block the request
      condition: {
        urlFilter: `||${domain}^`, // Block specific domain and its subdomains
        resourceTypes: [
          "main_frame", "sub_frame", "stylesheet", "script",
          "image", "font", "media", "websocket",
          "xmlhttprequest", "ping", "csp_report", "other"
        ]
      }
    }));

    // Get current dynamic rules to remove old ones before adding new ones
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = currentRules.map(rule => rule.id);

    // Update dynamic rules: remove old, add new
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: newRules
    });

    console.log(`Successfully updated ${newRules.length} declarativeNetRequest rules.`);

    // Store the raw list in local storage for persistence and quick loading on restart
    await chrome.storage.local.set({ [BLOCK_LIST_STORAGE_KEY]: rawDomains });
    console.log("Raw block list stored locally.");

  } catch (error) {
    console.error("Failed to fetch or apply block list:", error);
    // If fetching fails, try to load from storage and apply as a fallback
    await loadBlockListFromStorageAndApply();
  }
}

/**
 * Loads the raw block list from local storage and applies it as declarativeNetRequest rules.
 * This is used for quick startup and as a fallback if fetching from AdVault fails.
 */
async function loadBlockListFromStorageAndApply() {
  console.log("Attempting to load block list from storage and apply...");
  try {
    const data = await chrome.storage.local.get(BLOCK_LIST_STORAGE_KEY);
    if (data[BLOCK_LIST_STORAGE_KEY] && data[BLOCK_LIST_STORAGE_KEY].length > 0) {
      const rawDomains = data[BLOCK_LIST_STORAGE_KEY];
      console.log(`Loaded ${rawDomains.length} domains from storage.`);

      const newRules = rawDomains.map((domain, index) => ({
        id: DNR_RULE_ID_OFFSET + index,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: [
            "main_frame", "sub_frame", "stylesheet", "script",
            "image", "font", "media", "websocket",
            "xmlhttprequest", "ping", "csp_report", "other"
          ]
        }
      }));

      const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
      const oldRuleIds = currentRules.map(rule => rule.id);

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: newRules
      });
      console.log(`Successfully applied ${newRules.length} rules from storage.`);
    } else {
      console.log("No block list found in storage.");
    }
  } catch (error) {
    console.error("Failed to load or apply block list from storage:", error);
  }
}

// --- Initialization ---

// On extension installation or update
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Ad Blocker Installed or Updated. Initializing block list...');
  await fetchAndApplyBlockList();
  // Clear any existing alarm and create a new one after installation/update
  chrome.alarms.clear("updateBlockList");
  chrome.alarms.create("updateBlockList", {
    // No delayInMinutes if you want it to fire based on period from now
    // Or set a short delay like 1 minute if you want first recurring check soon after install
    periodInMinutes: UPDATE_INTERVAL_MINUTES // Set the recurring period
  });
});

// On browser startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started. Loading block list from storage and fetching latest...');
  await loadBlockListFromStorageAndApply(); // Quick load from storage first
  await fetchAndApplyBlockList();           // Then fetch latest in background
  // Clear any existing alarm and create a new one on startup
  chrome.alarms.clear("updateBlockList");
  chrome.alarms.create("updateBlockList", {
    delayInMinutes: 1, // Give it a short delay to ensure startup tasks complete
    periodInMinutes: UPDATE_INTERVAL_MINUTES
  });
});

// Listen for the periodic update alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "updateBlockList") {
    console.log("Alarm triggered: Updating block list...");
    await fetchAndApplyBlockList();
  }
});

console.log("Background service worker started.");