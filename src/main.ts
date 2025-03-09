import { chromium } from "@playwright/test";

(async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://accounts.pixiv.net/login?return_to=https%3A%2F%2Fwww.pixiv.net%2F&lang=ja&source=pc&view_type=page");
    await page.waitForLoadState("networkidle");

    // フォーム要素を取得
    const form = await page.$("form");
    // input type="text"要素を取得
    const input = await form?.$("input[type='text']");
    input?.fill("username");
    // input type="password"要素を取得
    const password = await form?.$("input[type='password']");
    password?.fill("password");
    // ログインボタンを取得。"ログイン"というテキストが入っているボタンを取得
    const button = await page.$("button:has-text('ログイン')");

    await browser.close();
})();
