const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const PROJECT_URL = "https://plateau-mineral-estimation.vercel.app/";
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "report_assets");
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function waitForDashboard(page) {
  await page.goto(PROJECT_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3500);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: EDGE_PATH,
  });

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await waitForDashboard(desktop);
  await desktop.screenshot({
    path: path.join(OUT_DIR, "deployed_dashboard_desktop.png"),
    fullPage: false,
  });

  try {
    await desktop.getByPlaceholder("9.750000").fill("9.750000");
    await desktop.getByPlaceholder("8.750000").fill("8.750000");
    await desktop.getByRole("button", { name: /Estimate Mineral Potential/i }).click();
    await desktop.waitForTimeout(9000);
    await desktop.screenshot({
      path: path.join(OUT_DIR, "deployed_estimation_result.png"),
      fullPage: false,
    });
  } catch (error) {
    console.warn("Could not capture estimation workflow:", error.message);
  }

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
  });
  await waitForDashboard(mobile);
  await mobile.screenshot({
    path: path.join(OUT_DIR, "deployed_dashboard_mobile.png"),
    fullPage: false,
  });

  await browser.close();
  console.log(OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
