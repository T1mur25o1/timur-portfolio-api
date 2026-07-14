import { randomUUID } from "crypto";
import store from "./mongoStore.js";

const defaultData = {
  hero: {
    badge: "Cyber Security Student — New Uzbekistan University",
    name: "Timur",
    roles: [
      "Full-Stack Developer",
      "Cyber Security Analyst",
      "Telegram Bot Developer",
      "Trading EA & Indicator Developer",
    ],
    description:
      "I build secure web platforms, automate workflows with Telegram bots, analyze systems for vulnerabilities, and engineer algorithmic trading tools — turning complex problems into reliable, working software.",
  },
  about: {
    eyebrow: "Whoami",
    heading: "Securing systems by day, building products by night.",
    paragraph:
      "I'm a Cyber Security major who codes across the whole stack. That combination means I don't just ship features — I think about how they can break, who might attack them, and how to build them right the first time. Outside of coursework I design full websites, build Telegram bots that automate real workflows, and write Expert Advisors and custom indicators for MetaTrader.",
    stats: [
      { label: "Domains", value: "4" },
      { label: "Focus", value: "Cyber Security" },
      { label: "University", value: "NewUU" },
      { label: "Mindset", value: "Build & Secure" },
    ],
  },
  contact: {
    email: "your.email@example.com",
    telegram: "https://t.me/yourhandle",
    github: "https://github.com/yourhandle",
    linkedin: "https://linkedin.com/in/yourhandle",
  },
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "MQL4 / MQL5",
    "Telegram Bot API",
    "SQL / NoSQL",
    "Linux",
    "Wireshark",
    "Nmap",
    "Burp Suite",
    "Docker",
    "Git",
    "REST APIs",
    "Network Security",
  ],
  services: [
    {
      id: randomUUID(),
      icon: "code",
      color: "cyan",
      title: "Website Building",
      subtitle: "Full-Stack Development",
      description:
        "End-to-end web apps — from responsive front-ends to robust back-ends, databases, and deployment. Fast, scalable, and built to last.",
      tags: ["React", "Node.js", "APIs", "Databases"],
    },
    {
      id: randomUUID(),
      icon: "shield",
      color: "green",
      title: "Cyber Security Analyst",
      subtitle: "Threat & Vulnerability Assessment",
      description:
        "Security audits, vulnerability scanning, hardening recommendations, and log/traffic analysis to keep systems and networks resilient.",
      tags: ["Pentesting", "Network Analysis", "Hardening", "Log Auditing"],
    },
    {
      id: randomUUID(),
      icon: "bot",
      color: "violet",
      title: "Telegram Bot Maker",
      subtitle: "Automation & Integrations",
      description:
        "Custom Telegram bots for business automation, notifications, payments, and community management — built to run reliably 24/7.",
      tags: ["Python", "Node.js", "Bot API", "Automation"],
    },
    {
      id: randomUUID(),
      icon: "chart",
      color: "fuchsia",
      title: "Trading EA & Indicator Maker",
      subtitle: "Algorithmic Trading Tools",
      description:
        "Expert Advisors and custom indicators for MetaTrader (MQL4/5) — strategy automation, backtesting, and performance optimization.",
      tags: ["MQL4/5", "Backtesting", "Strategy Automation", "Indicators"],
    },
  ],
  projects: [
    {
      id: randomUUID(),
      icon: "globe",
      color: "cyan",
      category: "Full-Stack",
      title: "Business Portfolio Platform",
      description:
        "A responsive multi-page web platform with an admin dashboard, contact automation, and CMS-driven content.",
      tags: ["React", "Node.js", "MongoDB"],
    },
    {
      id: randomUUID(),
      icon: "shield",
      color: "green",
      category: "Cyber Security",
      title: "Network Vulnerability Scanner",
      description:
        "A scripted toolkit for scanning local networks, fingerprinting services, and flagging common misconfigurations.",
      tags: ["Python", "Nmap", "Reporting"],
    },
    {
      id: randomUUID(),
      icon: "bot",
      color: "violet",
      category: "Telegram Bot",
      title: "Order & Notification Bot",
      description:
        "A production Telegram bot handling orders, payment status, and automated customer notifications for a small business.",
      tags: ["Python", "Telegram API", "Webhooks"],
    },
    {
      id: randomUUID(),
      icon: "chart",
      color: "fuchsia",
      category: "Trading",
      title: "Trend-Following EA",
      description:
        "A MetaTrader Expert Advisor combining trend and momentum filters, with a companion custom indicator and full backtest report.",
      tags: ["MQL5", "MetaTrader", "Backtesting"],
    },
  ],
};

export async function initDb() {
  await store.read();
  if (!store.data) {
    store.data = defaultData;
    await store.write();
  }
  return store;
}

export default store;
