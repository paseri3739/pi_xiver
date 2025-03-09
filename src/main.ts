import { Browser, chromium } from "@playwright/test";

(async function main() {
    const browser: Browser = await chromium.launch({headless: false});
    const context =
})();
