const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

const html = fs.readFileSync("dist/index.html", "utf8");

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost/",
  virtualConsole: new jsdom.VirtualConsole().sendTo(console)
});

setTimeout(() => {
  console.log("Check complete.");
  process.exit(0);
}, 3000);
