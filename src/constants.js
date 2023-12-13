const { version } = require("../package.json");
const isMac = process.platform === "darwin" ? true : false;
const divider = isMac ? "/" : "\\";
// 存储模版的位置
const downloadDirectory = `${
  process.env[isMac ? "HOME" : "USERPROFILE"]
}${divider}template`;
module.exports = {
  version,
  downloadDirectory,
  divider,
};
