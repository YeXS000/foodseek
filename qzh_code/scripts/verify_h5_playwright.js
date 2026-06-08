const { chromium } = require("playwright");

async function main() {
  const url = process.argv[2] || "http://localhost:5173";
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => ({
    title: document.title,
    shops: window.FOODSEEK_DATA?.shops?.length || 0,
    cards: document.querySelectorAll(".shop-card").length,
    markers: document.querySelectorAll(".leaflet-overlay-pane path, .leaflet-marker-icon").length,
    detailVisible: Boolean(document.querySelector("#detailPanel h2")),
    resultCount: document.querySelector("#resultCount")?.textContent,
    geoStatus: document.querySelector("#geoStatus")?.textContent,
    mapText: document.querySelector("#map")?.textContent || "",
  }));

  await browser.close();
  console.log(JSON.stringify({ result, errors }, null, 2));
  if (errors.length || result.shops !== 99 || result.cards === 0 || result.markers === 0 || !result.detailVisible) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
