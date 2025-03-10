import dotenv from "dotenv";
import * as fs from "fs";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

dotenv.config();

// Stealth プラグインを有効化
chromium.use(stealth());

const COOKIE_FILE = "cookies.json";
const CHROME_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

(async function main() {
    const browser = await chromium.launch({ headless: false }); // **ヘッドレスをオフ**
    const context = await browser.newContext({
        userAgent: CHROME_USER_AGENT,
    });

    await context.setExtraHTTPHeaders({
        "accept-language": "ja,en-US;q=0.9,en;q=0.8",
        "sec-ch-ua": '"Google Chrome";v="123", "Chromium";v="123", "Not:A-Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    });

    const page = await context.newPage();

    // **Cloudflareの対策としてwaitを長めに**
    await page.waitForTimeout(5000);

    if (fs.existsSync(COOKIE_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf-8"));
        await context.addCookies(cookies);

        await page.goto(
            "https://accounts.pixiv.net/login?return_to=https%3A%2F%2Fwww.pixiv.net%2F&lang=ja&source=pc&view_type=page",
            { waitUntil: "networkidle" }
        );

        console.log("ログイン済みのcookieを使用しました。");

        const loginCheck = await page.$(`input[placeholder="メールアドレスまたはpixiv ID"]`);
        if (!loginCheck) {
            console.log("ログイン済みと判定");
            await browser.close();
            return;
        }
        console.log("セッションが切れていたため再ログインします。");
    }

    await page.goto(
        "https://accounts.pixiv.net/login?return_to=https%3A%2F%2Fwww.pixiv.net%2F&lang=ja&source=pc&view_type=page",
        { waitUntil: "networkidle" }
    );

    await page.waitForSelector(`input[placeholder="メールアドレスまたはpixiv ID"]`);
    await page.waitForSelector(`input[placeholder="パスワード"]`);
    await page.waitForSelector(`button[type="submit"]:has-text("ログイン")`);

    const USER_NAME = process.env.USER_NAME || "";
    const PASSWORD = process.env.PASSWORD || "";

    const mail = await page.$(`input[placeholder="メールアドレスまたはpixiv ID"]`);
    await mail?.fill(USER_NAME);

    const password = await page.$(`input[placeholder="パスワード"]`);
    await password?.fill(PASSWORD);

    const button = await page.waitForSelector('button[type="submit"]:has-text("ログイン")');
    await button?.waitForElementState("visible");
    await button?.waitForElementState("enabled");
    await button?.click();

    // **CloudflareのCAPTCHAが出る場合は待機**
    console.log("もしCAPTCHAが出たら手動で突破してください...");
    await page.waitForTimeout(20000); // 20秒待機（手動突破用）

    // **ログイン後、cookieを保存**
    await page.waitForLoadState("networkidle");
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));

    console.log("ログイン成功、cookieを保存しました。");

    await browser.close();
})();
