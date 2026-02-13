# WSL 本地可视化当前问题报告

## 1. 问题描述
用户在 Windows 浏览器访问 VULCA prototype 可视化地址失败（“还是不行”），与服务侧自检结果不一致。

## 2. 复现现象
- WSL 内启动命令可运行：
  - `venv/bin/python -m app.prototype.ui.gradio_demo`
- WSL 内探测返回正常：
  - `http://127.0.0.1:7860` -> `200`
  - `http://172.19.52.44:7860` -> `200`
- 用户浏览器侧仍无法访问。

## 3. 已确认事实
- `gradio` 依赖已安装。
- 服务已按 `0.0.0.0:7860` 绑定启动。
- 进程稳定性存在风险：若运行会话结束，服务可能退出，导致端口瞬时可用但后续不可用。

## 4. 可能根因（按概率）
1. **WSL 与 Windows 访问链路问题**：localhost 映射未生效或策略变化。
2. **Windows 防火墙/安全软件拦截**：阻断到 WSL 7860 端口。
3. **服务保活机制不足**：会话回收后进程被终止。
4. **IP 变化**：WSL 重启后 IP 变更，使用旧 IP 访问失败。

## 5. 排查与修复清单
1. Windows 端执行：
   - `curl http://localhost:7860`
   - `curl http://<当前WSL_IP>:7860`
2. WSL 端执行：
   - `ip -4 addr show eth0`
   - `ss -ltnp | grep 7860`
3. 改为稳定保活启动（tmux/screen/systemd user）。
4. 必要时配置 Windows `netsh interface portproxy` 显式转发。

## 6. 通过标准
- Windows 浏览器可稳定打开可视化页面（连续 10 分钟可访问）。
- 刷新页面与重复请求无中断。
- 重启一次 WSL 后，按文档 1 分钟内可恢复访问。

