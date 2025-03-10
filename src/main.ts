import { chromium } from "@playwright/test";
import * as fs from "fs";

const COOKIE_FILE = "cookies.json";

(async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // **cookieがあれば利用してトップページへ遷移**
    if (fs.existsSync(COOKIE_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf-8"));
        await context.addCookies(cookies);

        // トップページへ直接遷移
        await page.goto("https://www.pixiv.net/", { waitUntil: "networkidle" });

        console.log("ログイン済みのcookieを使用しました。");

        // セッションが切れていた場合はログインし直す
        const loginCheck = await page.$(`input[placeholder="メールアドレスまたはpixiv ID"]`);
        if (!loginCheck) {
            console.log("ログイン済みと判定");
            await browser.close();
            return;
        }
        console.log("セッションが切れていたため再ログインします。");
    }

    // **ログインページへ遷移**
    await page.goto(
        "https://accounts.pixiv.net/login?return_to=https%3A%2F%2Fwww.pixiv.net%2F&lang=ja&source=pc&view_type=page",
        { waitUntil: "networkidle" }
    );

    // ログインフォームの要素を待機
    await page.waitForSelector(`input[placeholder="メールアドレスまたはpixiv ID"]`);
    await page.waitForSelector(`input[placeholder="パスワード"]`);
    await page.waitForSelector(`button[type="submit"]:has-text("ログイン")`);

    // 環境変数から取得（dotenv推奨）
    const USER_NAME = process.env.USER_NAME || "";
    const PASSWORD = process.env.PASSWORD || "";

    const mail = await page.$(`input[placeholder="メールアドレスまたはpixiv ID"]`);
    await mail?.fill(USER_NAME);

    const password = await page.$(`input[placeholder="パスワード"]`);
    await password?.fill(PASSWORD);

    // ログインボタンを取得
    const button = await page.waitForSelector('button[type="submit"]:has-text("ログイン")');
    await button?.waitForElementState("visible");
    await button?.waitForElementState("enabled");
    await button?.click();

    // **ログイン後、cookieを保存**
    await page.waitForLoadState("networkidle");
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));

    console.log("ログイン成功、cookieを保存しました。");

    await browser.close();
})();
