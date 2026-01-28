const fs = require("fs");
const path = require("path");

const type = process.argv[2] || "patch";
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const [major, minor, patch] = pkg.version.split(".").map(Number);

let newVersion;
if (type === "major") newVersion = `${major + 1}.0.0`;
else if (type === "minor") newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log("Version bumped to", newVersion);
