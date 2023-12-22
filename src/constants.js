const { version } = require("../package.json");
const isMac = process.platform === "darwin" ? true : false;
const divider = isMac ? "/" : "\\";
// 存储模版的位置
const downloadDirectory = `${
  process.env[isMac ? "HOME" : "USERPROFILE"]
}${divider}template`;
const repositoriesUrl = "https://api.github.com/users/kepengqi/repos";
const downLoadUrl = "https://api.github.com/repos";
module.exports = {
  version,
  downloadDirectory,
  divider,
  repositoriesUrl,
  downLoadUrl,
};
