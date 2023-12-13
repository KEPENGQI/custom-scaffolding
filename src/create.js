// 获取仓库模板信息
const axios = require("axios");
const ora = require("ora");
const inquirer = require("inquirer");
const { promisify } = require("util");
const path = require("path");
let downloadGitRepo = require("download-git-repo");
let ncp = require("ncp");
const metalsmith = require("metalsmith");
let { render } = require("consolidate").ejs;
downloadGitRepo = promisify(downloadGitRepo);
ncp = promisify(ncp);
render = promisify(render);
const fs = require("fs");
const { downloadDirectory, divider } = require("./constants");
const repositoryUrl = "https://api.github.com/orgs/td-cli";
const fetchRepolist = async () => {
  const { data } = await axios.get(`${repositoryUrl}/repos`);
  return data;
};
// 封装loading
const waitFnLoading =
  (fn, message) =>
  async (...args) => {
    const spinner = ora(message);
    spinner.start();
    let repos = await fn(...args);
    spinner.succeed();
    return repos;
  };
// 获取tags列表
const fetchTagList = async (repo) => {
  const { data } = await axios.get(
    `https://api.github.com/repos/td-cli/${repo}/tags`
  );
  return data;
};
// 下载项目模板
const downloadTemplate = async (repo, tag) => {
  let api = `td-cli/${repo}`;
  if (tag) api += `#${tag}`;
  const dest = `${downloadDirectory}${divider}${repo}`;
  console.log("downloadDirectory", downloadDirectory);
  console.log("repo", repo);
  console.log("dest", dest);
  await downloadGitRepo(api, dest);
  return dest;
};
module.exports = async (projectName) => {
  // 1.获取项目模板
  let repos = await waitFnLoading(fetchRepolist, "正在加载模板列表...")();
  repos = repos.map((item) => item.name);
  const { repo } = await inquirer.prompt({
    name: "repo", //选择后的结果
    type: "list", // 什么方式展现
    message: "请选择开发模板",
    choices: repos, //选择的数据
  });
  // 2. 获取版本号
  let tags = await waitFnLoading(fetchTagList, "正在获取版本号...")(repo);
  tags = tags.map((item) => item.name);
  // 选择版本号
  const { tag } = await inquirer.prompt({
    name: "tag", //选择后的结果
    type: "list", // 什么方式展现
    message: "请选择版本号",
    choices: tags, //选择的版本列表
  });
  // 下载项目 返回一个临时的存放目录
  const dest = await waitFnLoading(downloadTemplate, "正在下载模板...")(
    repo,
    tag
  );
  if (!fs.existsSync(path.join(dest, "ask.js"))) {
    await ncp(dest, path.resolve(projectName));
  } else {
    // 复杂的模板
    // 需要用户选择，然后编译模板
    await new Promise((resolve, reject) => {
      // 如果传入路径，就会默认遍历当前文件下的src文件
      metalsmith(__dirname)
        .source(dest)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          // files是所有文件
          // 拿到提前配置好的信息 传下去渲染
          console.log(1111);
          console.log("path.join(dest)", path.join(dest));
          const args = require(path.join(dest, "ask.js"));
          console.log(222);
          // 拿到了信息，让用户填写，并返回信息
          const obj = await inquirer.prompt(args);
          const meta = metal.metadata(); //获取的信息并传入下一use
          Object.assign(meta, obj);
          delete files["ask.js"];
          done();
        })
        .use((files, metal, done) => {
          // 更新用户信息渲染模板
          const obj = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes("js") || file.includes("json")) {
              let content = files[file].contents.toString();
              // 判断是不是模板
              if (content.includes("<%")) {
                content = await render(content, obj);
                files[file].contents = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            console.log("err", err);
            reject();
          } else {
            resolve();
          }
        }); //编译要去的地方
    });
  }
};
