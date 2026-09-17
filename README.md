# 八条猫桌宠 · SillyTavern 第三方扩展

把桌宠挂到酒馆页面：气泡吐槽、图片投喂、偷看当前聊天，并可复用酒馆当前模型。

## 安装

1. 将整个 `EightTailCat-Pet` 文件夹复制到酒馆扩展目录之一：
   - 当前用户：`SillyTavern/data/<user>/extensions/EightTailCat-Pet`
   - 所有用户：`SillyTavern/public/scripts/extensions/third-party/EightTailCat-Pet`
2. 重启 SillyTavern，在 **扩展** 里启用 **八条猫桌宠**。
3. 扩展设置抽屉中会出现「八条猫设置」，可打开半透明面板或隐藏桌宠。

也可在酒馆「安装扩展」里填本仓库 / 本文件夹路径（需含 `manifest.json`）。

## 目录

```
EightTailCat-Pet/
  manifest.json
  index.js          # 生命周期：注入 #pet-container、设置抽屉
  style.css         # 宿主浮层（fixed + z-index:9999）
  settings.html     # 扩展设置入口「八条猫设置」
  pet.html          # 桌宠本体（iframe，样式内嵌以免污染酒馆）
  assets/cat1.png
  assets/cat2.png
  data/kaomoji.json
```

## 用法

- 拖拽猫咪：在酒馆窗口内自由定位（位置会写入扩展设置）。
- 右键 ✨：读取 `SillyTavern.getContext().chat` 最近消息并吐槽。
- 右键 🍜：打开投喂栏，HTML5 拖图 / 选图走视觉 API。
- 生成：默认走酒馆当前连接（`generateRaw` / `generateQuietPrompt`）；可在面板里关掉「评价生成优先用酒馆当前模型」，改用独立 SiliconFlow / OpenAI Endpoint。
- 世界书 / 角色卡：生成时会尝试并入酒馆已激活的 World Info 与当前角色描述。

独立 PyQt 桌宠（仓库根目录 `main.py` + `index.html`）不受影响。
