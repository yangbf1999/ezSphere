import { useCallback } from "react";
import { useTranslation } from "react-i18next";

const motherFallbacks: Record<string, string> = {
  "mother.selectModel": "选择模型",
  "mother.hintInstall": "安装 {agent}",
  "mother.enterMessage": "输入消息...",
  "mother.servers": "服务器",
  "mother.sshGuide": "添加指南",
  "mother.local": "本机",
  "mother.addServer": "添加服务器",
  "mother.hostIp": "主机 / IP",
  "mother.port": "端口",
  "mother.username": "用户名",
  "mother.passwordKey": "密码 / 密钥",
  "mother.hostPlaceholder": "例如 192.168.1.100 或 myserver.com",
  "mother.userPlaceholder": "例如 root",
  "mother.passwordPlaceholder": "SSH 密码或私钥路径",
  "mother.displayName": "显示名称",
  "mother.optional": "可选",
  "mother.displayNamePlaceholder": "如：Agent#03、服务器17",
  "mother.encrypted": "已全局加密，环境变化时密码将自毁",
  "mother.testing": "测试中...",
  "mother.testConnection": "测试连接",
  "mother.cancel": "取消",
  "mother.addServerBtn": "添加服务器",
  "mother.deleteServerTitle": "删除服务器",
  "mother.deleteServerMsg": "此服务器将被永久移除，此操作无法撤销。",
  "mother.hintShowSpecs": "查看服务器的硬件配置(系统、CPU、内存、磁盘)",
  "mother.hintShowSpecsLocal": "查看本机的硬件配置(系统、CPU、内存、磁盘)",
  "mother.hintTroubleshoot": "{agent} 不好用了，帮我修复",
  "mother.hintUninstall": "完全卸载 {agent}",
  "mother.hintNetworkInfo": "查看内网/公网IP",
  "mother.hintSecurityAudit": "检测可疑活动",
  "ssh.cloudDesc": "云服务器通常需要公网 IP、用户名、密码或密钥。",
  "ssh.usernameHint": "用户名",
  "ssh.passwordHint": "密码",
  "ssh.ipHint": "IP",
  "ssh.portHint": "端口",
  "ssh.cloudUsername": "云控制台中的登录用户",
  "ssh.cloudPassword": "实例密码或密钥",
  "ssh.cloudIp": "公网 IP",
  "ssh.winNote": "Windows 部署 SSH 较为复杂，建议先在目标机器开启 OpenSSH Server。",
  "ssh.macStep": "系统设置 -> 通用 -> 共享 -> 远程登录",
  "ssh.macOr": "也可以运行",
  "ssh.macUsername": "当前 macOS 用户名",
  "ssh.macPassword": "登录密码",
  "ssh.macIp": "局域网 IP",
  "ssh.linuxNote": "不同发行版包管理器可能不同。",
  "ssh.linuxUsername": "Linux 用户名",
  "ssh.linuxPassword": "登录密码或密钥",
  "ssh.linuxIp": "服务器 IP",
  "ssh.termuxUsername": "运行 whoami 查看",
  "ssh.termuxPassword": "运行 passwd 设置",
  "ssh.termuxIp": "运行 ip addr 查看",
  "ssh.ishUsername": "iSH 用户名",
  "ssh.ishPassword": "运行 passwd 设置",
  "ssh.ishIp": "设备 IP",
  "btn.delete": "删除",
  "btn.cancel": "取消",
  "btn.edit": "编辑",
  "error.userCancelled": "已取消",
  "error.requestFailed": "请求失败",
  "error.connectionTimeout": "连接超时",
  "error.serverUnreachable": "服务器不可达",
  "error.agentFailed": "Agent 启动失败",
  "error.noServerConfig": "未配置服务器",
  "error.noModelSelected": "请先选择模型",
};

export function useI18n() {
  const { t: translate, i18n } = useTranslation();
  const t = useCallback(
    (key: string) => {
      const translated = translate(key);
      if (translated && translated !== key) return translated;
      return motherFallbacks[key] ?? key;
    },
    [translate],
  );

  return {
    t,
    locale: i18n.language || "zh",
  };
}
