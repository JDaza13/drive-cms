import type { Messages } from "./types";

export const zh: Messages = {
  meta: {
    title: "Drive CMS：从 Google 云端硬盘发布的最新动态",
    description: "在云端硬盘文件夹中写一篇 Google 文档即可发布新闻和动态。欢迎通过 WhatsApp 联系我们。",
  },
  nav: { label: "主导航", feed: "最新动态", contact: "联系我们" },
  language: { label: "语言" },
  cta: {
    whatsapp: "WhatsApp",
    seeFeed: "查看动态",
    whatsappMessage: "您好，我看到了您的网站，想了解更多信息。",
  },
  hero: {
    eyebrow: "从 Google 云端硬盘发布",
    title: "写一篇文档，就能出现在网页上。",
    text: "保存到文件夹里的每篇 Google 文档或图片，几分钟内就会发布到这里，无需写代码，也无需登录后台。",
  },
  feed: {
    title: "最新动态",
    text: "文件夹中的最新内容，按时间从新到旧排列。",
    loading: "正在加载动态…",
    error: "无法加载动态。",
    retry: "重试",
    empty: "暂时还没有发布内容。",
    demoNotice: "示例内容：动态尚未连接到 Google 云端硬盘。",
    readMore: "展开全文",
    readLess: "收起",
    updated: "更新于",
  },
  contact: {
    title: "联系我们",
    text: "填写以下信息后，将打开 WhatsApp 并准备好您的消息。",
    name: "您的姓名",
    topic: "主题",
    topics: {
      info: "一般咨询",
      quote: "报价",
      other: "其他",
    },
    message: "留言",
    messagePlaceholder: "请告诉我们您的需求",
    submit: "通过 WhatsApp 发送",
    privacy: "我们不会保存您的信息：消息将直接发送到 WhatsApp。",
    errors: {
      name: "请输入您的姓名。",
      message: "请再多写一些（至少 10 个字符）。",
    },
    whatsappMessage: ({ name, topicLabel, message }) =>
      `您好，我是${name}。\n主题：${topicLabel}\n\n${message}`,
  },
  footer: { poweredBy: "内容由 Google 云端硬盘发布。" },
};
