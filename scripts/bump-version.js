const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const packagePaths = [
  path.join(root, "package.json"),
  path.join(root, "packages", "project", "package.json"),
  path.join(root, "packages", "expo", "package.json"),
  path.join(root, "packages", "cli", "package.json"),
];

const interPackageDeps = {
  "@mono-labs/project": true,
  "@mono-labs/expo": true,
};

// Read current version from root package.json
const rootPkg = JSON.parse(fs.readFileSync(packagePaths[0], "utf8"));
const [major, minor, patch] = rootPkg.version.split(".").map(Number);
const bumpType = process.argv[2] || "patch";

let newVersion;
if (bumpType === "major") {
  newVersion = `${major + 1}.${minor}.${patch + 1}`;
} else if (bumpType === "minor") {
  newVersion = `${major}.${minor + 1}.${patch + 1}`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update all package.json files
for (const pkgPath of packagePaths) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;

  // Update inter-package dependency versions
  if (pkg.dependencies) {
    for (const dep of Object.keys(pkg.dependencies)) {
      if (interPackageDeps[dep]) {
        pkg.dependencies[dep] = newVersion;
      }
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

process.stdout.write(newVersion);
