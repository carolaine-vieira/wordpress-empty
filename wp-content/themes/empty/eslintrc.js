module.exports = {
    "extends": "airbnb-base",
    "rules": {
      "import/no-unresolved": "off",
      "import/extensions": "off",
      "import/first": "off",
    },
    "overrides": [
      {
        "files": ["**/frontend.js"],
        "env": {
          "browser": true
        }
      }
    ]
};
