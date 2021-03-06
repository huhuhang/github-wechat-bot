/**
 * 
 * @param {JSON} response 处理JSON格式的响应
 * @returns 
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return JSON.stringify(await response.json())
  }
}

/**
 * 
 * @param {String} botKey 企业微信机器人密钥
 * @param {String} content 需要发送的内容，支持 Markdown 格式
 * @returns 
 */
async function sendMdMsg(botKey, content) {
  const baseUrl = "https://qyapi.weixin.qq.com/cgi-bin/webhook/"
  const url = `${baseUrl}send?key=${botKey}`
  const init = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "msgtype": "markdown",
      "markdown": {
        "content": content
      }
    })
  }
  const response = await fetch(url, init)
  return await gatherResponse(response)
}

// 标记事件动作
const actionWords = {
  "opened": "<font color='info'>创建</font>",
  "closed": "<font color='warning'>关闭</font>",
  "reopened": "<font color='info'>重新发起</font>",
  "edited": "<font color='info'>更新</font>",
  "merge": "<font color='warning'>合并</font>",
  "created": "<font color='info'>创建</font>",
  "requested": "<font color='info'>请求</font>",
  "completed": "<font color='warning'>完成</font>",
  "synchronize": "<font color='info'>同步更新</font>"
};

/**
 * 处理 Ping 请求
 * @param {String} botKey 企业微信机器人密钥
 * @param {JSON} reqBody GitHub 传递的请求体
 * @returns 
 */
async function handlePing(botKey, reqBody) {
  const { hook, repository, organization } = reqBody;
  // 判定是组织还是仓库配置 Webhook
  if (hook.type == "Organization") {
    var mdMsg = "成功收到了来自 Github 的 Ping 请求，组织: " + organization.login;
  } else {
    var mdMsg = "成功收到了来自 Github 的 Ping 请求，仓库地址: " + repository.html_url;
  }
  return await sendMdMsg(botKey, mdMsg);
}

/**
 * 处理 PR 请求
 * @param {String} botKey 企业微信机器人密钥
 * @param {JSON} reqBody GitHub 传递的请求体
 * @returns 
 */
async function handlePR(botKey, reqBody) {
  const { action, sender, pull_request, repository } = reqBody;
  if (sender.type !== "Bot") {
    if (action == "opened" || action == "reopened") {
      const mdMsg = `${sender.login} 在 [${repository.full_name}](${repository.html_url}) ${actionWords[action]}了一个 PR:
      > 分支: ${pull_request.head.ref} → ${pull_request.base.ref}
      > 名称: [${pull_request.title}](${pull_request.html_url}) #${pull_request.number}
      > 修改: ${pull_request.changed_files} 个文件 (<font color="info">+ ${pull_request.additions}</font> <font color="warning">- ${pull_request.deletions}</font> 行修改)`;
      return await sendMdMsg(botKey, mdMsg);
    }
    else if (action == "closed" && pull_request.merged) {
      const mdMsg = `${sender.login} 在 [${repository.full_name}](${repository.html_url}) ${actionWords[action]}了一个 PR:
      > 分支: ${pull_request.head.ref} → ${pull_request.base.ref}
      > 名称: [${pull_request.title}](${pull_request.html_url}) #${pull_request.number}
      > 修改: ${pull_request.changed_files} 个文件 (<font color="info">+ ${pull_request.additions}</font> <font color="warning">- ${pull_request.deletions}</font> 行修改)
      > 发起: ${pull_request.user.login} (${pull_request.created_at})
      > 审核: ${pull_request.merged_by.login} (${pull_request.review_comments} 条意见)`;
      return await sendMdMsg(botKey, mdMsg);
    }
    else {
      return `${action} 操作暂时不会被处理`;
    }
  } else {
    return `${sender.type} 操作暂时不会被处理`;
  }
}

/**
 * 处理 Issues 请求
 * @param {String} botKey 企业微信机器人密钥
 * @param {JSON} reqBody GitHub 传递的请求体
 * @returns 
 */
async function handleIssue(botKey, reqBody) {
  const { action, sender, issue, repository } = reqBody;
  if (action == "opened" || action == "closed" || action == "reopened") {
    const mdMsg = `${sender.login}  在 [${repository.full_name}](${repository.html_url}) ${actionWords[action]}了一个 Issues:
    > 名称: [${issue.title}](${issue.html_url})`;
    return await sendMdMsg(botKey, mdMsg);
  }
  else {
    return `${action} 操作暂时不会被处理`;
  }
}

/**
 * 处理 Action 错误请求
 * @param {String} botKey 企业微信机器人密钥
 * @param {JSON} reqBody GitHub 传递的请求体
 * @returns 
 */
async function handleAction(botKey, reqBody) {
  const { action, sender, check_run, repository } = reqBody;
  // 如果状态完成且执行失败，则发送错误信息
  if (action == "completed" && check_run.conclusion == "failure") {
    const mdMsg = `${sender.login}  在 [${repository.full_name}](${repository.html_url}) 中触发的 GitHub Action 执行<font color="warning">失败</font>了:
    > 查看状态: [${check_run.name}](${check_run.html_url})
    > 错误信息: ${check_run.output.summary}`;
    return await sendMdMsg(botKey, mdMsg);
  }
  else {
    return `${action}(${check_run.conclusion}) 暂时不会被处理`;
  }
}

/**
 * 
 * @param {JSON} request GitHub 传递的请求
 * @returns 
 */
async function handleRequest(request) {
  const { searchParams } = new URL(request.url)
  // 从 URL 获取传入的机器人密钥
  let botKey = searchParams.get('key')
  // 从请求中获取消息内容
  var reqBody = await gatherResponse(request)
  // 解析 GitHub 传递的消息类型
  const gitEvent = request.headers.get("X-GitHub-Event")
  console.log(`收到了一个 ${gitEvent} 事件`)
  switch (gitEvent) {
    // 如果是 Ping 事件
    case "ping":
      var results = await handlePing(botKey, JSON.parse(reqBody))
      break;
    // 如果是 PR 事件
    case "pull_request":
      var results = await handlePR(botKey, JSON.parse(reqBody))
      break;
    // 如果是 Issues 事件
    case "issues":
      var results = await handleIssue(botKey, JSON.parse(reqBody))
      break;
    // 如果是 Action 事件
    case "check_run":
      var results = await handleAction(botKey, JSON.parse(reqBody))
      break;
    // 其他事件暂不支持
    default:
      var results = `暂不支持处理 ${gitEvent} 事件`
      break;
  }
  return new Response(results)
}

addEventListener("fetch", event => {
  const { request } = event
  // 仅处理 POST 请求
  if (request.method === "POST") {
    return event.respondWith(handleRequest(request))
  }
  else {
    return event.respondWith(new Response("使用方法请参考文档: https://github.com/huhuhang/github-wechat-bot"))
  }
})