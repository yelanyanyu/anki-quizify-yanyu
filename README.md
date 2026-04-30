# Quizify Word — 逐层例句揭示 + 自动评分

> Forked from [Quizify (格致)](https://github.com/e-chehil/anki-quizify) by @chehil (翏央).  
> 在原始 Quizify 交互模板基础上，新增「逐层渐进揭示 + 自动评分」单词学习模式。

---

## 与原版 Quizify 的主要区别

| 维度 | 原版 Quizify | Quizify Word (本版) |
|------|-------------|---------------------|
| **定位** | 通用交互模板（填空/选择/折叠/揭示/批注） | 专注**单词学习**，逐层揭示例句 + 自动评分 |
| **JS 架构** | 内嵌 `<script>` 块，12+ 个小块 | **外部 JS**：`_quizify.js`，通过 `<script src>` 加载 |
| **笔记字段** | Front, Back, Deck, Tags, Skip Replace | Word, Back, Media, ExampleList, Notes, Skip Replace |
| **Deck / Tags** | 手动填写字段 | Anki 自动注入（无需手动填） |
| **翻面/评分** | `showAnswer()` / `buttonAnswerEase1-4()` | `pycmd('ans')` / `pycmd('ease1-4')`（Desktop）；`showAnswer()`（AnkiDroid） |
| **牌组名** | Quizify Test::Nested Reveal | quizify-word-by:yelanyanyu |
| **调试模式** | 无 | ⚙ 设置按钮 → Debug Mode 开关 |
| **AnkiDroid 兼容** | 未测试 | 已适配（自动评分降级为手动评分） |

---

## 🌟 核心功能：逐层渐进揭示

复习时卡片正面先只显示**单词**，用户通过「认识/不认识/简单」三个按钮逐层揭示例句：

```
正面：单词 + 三个按钮
  ├─ 不认识 → 翻到背面，手动评分（重来/困难）
  ├─ 认识   → 揭示下一条例句 ... 直到全部认识 → 自动良好
  └─ 简单   → 一次性展示全部例句 → 再次确认 → 自动简单
```

点「不认识」翻面后，背面显示答案 + **例句揭示进度**（认识了 X/Y 个例句），已认识的标 ✓ 绿色，未揭示的标 ✗ 灰色。

点击例句可播放音频（如果 `ExampleList` 中配置了文件名）。

---

## 📋 笔记字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `Word` | 单词文本 | `<b>ephemeral</b>` |
| `Back` | 背面答案（支持 HTML） | 释义、词源、例句等 |
| `Media` | 单词发音音频（可选） | `[sound:ephemeral.mp3]` |
| `ExampleList` | 例句列表，`\|\|` 分隔，`::` 分隔文本和音频 | 见下方格式 |
| `Notes` | 用户笔记（可选），显示在背面 Back 上方 | 灰色斜体 |
| `Skip Replace` | 留空即可（控制原始标记解析开关） | — |

### ExampleList 格式

```
例句1文本::audio1.mp3||例句2文本||例句3文本::audio3.mp3
```

- `||` 分隔不同例句
- `::` 分隔文本和音频文件名（可选，无音频则只写文本）
- 音频文件需放入 `collection.media/` 文件夹
- 例句内部可以包含 `<br>` 换行

---

## 🛠️ 安装方法

### 从源码构建

```bash
pip install genanki
python export.py              # 导出 apkg
python export.py --no-card    # 仅笔记类型，不含测试卡片
```

### 导入 Anki

1. 导入生成的 `Deck/quizify-nested-reveal-test-android.apkg`
2. Anki 会自动创建笔记类型 `quizify-word-by:yelanyanyu` 和测试卡片
3. **重要**：如果之前导入过旧版，先删除 `collection.media/_quizify.js` 再重新导入，否则 Anki 会使用缓存的旧版 JS

### AnkiDroid（Android）

- 模板已做兼容处理：翻面正常，自动评分在 AnkiDroid 上不可用（Android WebView 限制），翻面后通过底栏按钮手动评分
- 务必在重新导入前清除旧版 `_quizify.js`

---

## 🔧 开发与调试

### 文件结构

```
├── Card Template/
│   ├── front1.html       # 正面模板（HTML + <script src="_quizify.js">）
│   ├── back1.html        # 背面模板（HTML + <script src="_quizify.js">）
│   └── _quizify.js       # 所有 JS 逻辑（外部文件，打包进 apkg media）
├── Style/
│   └── quizify.css       # 样式表（继承原版 + 例句组件样式）
├── export.py             # genanki 导出脚本
├── test.html             # 浏览器测试工具
└── README.md
```

### 调试模式

- 点击卡片右下角 ⚙ 齿轮 → 勾选 **Debug Mode**
- 卡片顶部出现绿色状态条，显示 JS 执行日志
- 状态在 Anki 会话内保持（翻到下一张仍记住开关）
- 默认关闭，不影响正常使用

### JS 架构要点

`_quizify.js` 作为**外部 JS 文件**通过 `<script src="_quizify.js">` 加载。这是因为 Anki 的 Qt WebEngine 有一个 bug：JS 字符串中的 HTML 闭合标签（如 `</div>`）和内嵌 `<script>` 块过大时，会导致整个 script 块被静默丢弃。外部 JS 文件完全绕过这个问题。

`_quizify.js` 被打包进 apkg 作为 media 文件，Anki 的 `ViewerResourceHandler`（AnkiDroid）和 media server（Desktop）自动提供访问。

### 平台 API 抽象

```javascript
window.__showAnswer()     // Desktop: pycmd('ans') | AnkiDroid: showAnswer()
window.__rateCard(ease)   // Desktop: pycmd('easeN') | AnkiDroid: 手动评分
```

---

## ⚠️ 已知限制

1. **AnkiDroid 不支持自动评分**——Android 新版 Reviewer 只接受 `ankidroid://show-answer` 翻面，`signal:answer_easeN` 被拦截并弹出"不支持"警告。在 AnkiDroid 上翻面后由用户通过底栏按钮手动选择评分。

2. **`[sound:file.mp3]` 在 ExampleList 中不可用**——Anki 渲染时将 `[sound:xxx]` 转为 `[anki:play:q:N]`，文件名被提取到 AV 标签列表。如需例句音频，在 `ExampleList` 中使用裸文件名（`::audio.mp3`）。

3. **外部 JS 缓存**——重新导入 apkg 时，Anki 不会覆盖 `collection.media/` 中已存在的同名文件。更新 `_quizify.js` 后必须手动删除旧文件或使用不同文件名。

---

## 📄 许可

原始 Quizify 模板版权所有 © chehil (翏央)。本派生版本遵循相同许可。原项目地址：https://github.com/e-chehil/anki-quizify
