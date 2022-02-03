# GitHub WeChat Bot

本项目提供了基于 Cloudflare Workers 部署 API，支持基于 GitHub Webhook 将操作消息推送给企业微信机器人。

目前支持：

- Issues 相关操作提醒。
- Pull Requests 相关操作提醒。
- 欢迎贡献支持更多操作提醒。

## 快速使用

你可以使用本项目配置好的服务：

- Webhook URL: `https://github-wechat-bot.huhuhang.workers.dev?key=<你的机器人密钥>`

为了更好的可用性，推荐按照下方步骤自行部署。

## 如何部署

你可以直接在 Cloudflare Workers 网页版中新建项目，并复制本仓库中的 `index.js` 到在线编辑器中部署。

或者使用官方提供的 wrangler cli 工具：

1. 了解 Cloudflare Workers 命令行工具 [wrangler](https://github.com/cloudflare/wrangler) 的使用方法。
2. 基于本项目初始化一个新的项目。

    ```bash
    wrangler generate github-wechat-bot https://github.com/huhuhang/github-wechat-bot
    ```

3. 请修改 `wrangler.toml` 中预留的 `account_id`，替换为你的账户信息。
4. 将 `github-wechat-bot` 项目添加到 Cloudflare Workers 部署。

## 如何使用

1. 基于上述步骤在 Cloudflare Workers 中部署完成后，你会得到类似 `https://github-wechat-bot.你的自定义域名.workers.dev` 的路由地址。

    ![1640744784436](https://cdn.jsdelivr.net/gh/huhuhang/cdn@master/images/2021/12/1640744784436.png)

2. 创建企业微信机器人，并获得 Webhook Key。

    ![1640744769818](https://cdn.jsdelivr.net/gh/huhuhang/cdn@master/images/2021/12/1640744769818.png)

3. 此时 Webhook 推送地址为：`https://github-wechat-bot.你的自定义域名.workers.dev/?key=你的企业微信机器人KEY`

4. 在 GitHub 上配置 Webhook，将 Webhook 的 URL 替换为上述路由地址。注意选择 `application/json` 类型，下方推送消息类别可以包含目前支持的 Issues，Pull requests。

    ![1640744749518](https://cdn.jsdelivr.net/gh/huhuhang/cdn@master/images/2021/12/1640744749518.png)

5. 如果一切顺利，你会在企业微信群内收到 PING 请求。