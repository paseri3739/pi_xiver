import { chromium } from "@playwright/test";

(async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // cookieがあれば利用してトップページへ遷移

    await page.goto(
        "https://accounts.pixiv.net/login?return_to=https%3A%2F%2Fwww.pixiv.net%2F&lang=ja&source=pc&view_type=page",
        { waitUntil: "networkidle" }
    );
    await page.waitForLoadState("networkidle");
    // プレースホルダーが出現するまで待機
    await page.waitForSelector(`input[placeholder="メールアドレスまたはpixiv ID"]`);
    await page.waitForSelector(`input[placeholder="パスワード"]`);
    await page.waitForSelector(`button[type="submit"]:has-text("ログイン")`);
    const mail = await page.$(`input[placeholder="メールアドレスまたはpixiv ID"]`);
    // TODO: dotenvを使って環境変数から取得する
    const USER_NAME = process.env.USER_NAME || "";
    const PASSWORD = process.env.PASSWORD || "";
    await mail?.fill(USER_NAME);
    const password = await page.$(`input[placeholder="パスワード"]`);
    await password?.fill(PASSWORD);

    // ログインボタンを取得。"ログイン"というテキストが入っているボタンを取得
    const button = await page.waitForSelector('button[type="submit"]:has-text("ログイン")');

    await button?.waitForElementState("visible");
    await button?.waitForElementState("enabled");
    await button?.click();

    const cookies = await context.cookies();

    await browser.close();
})();
