module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/dist-web/", "/functions/lib/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
