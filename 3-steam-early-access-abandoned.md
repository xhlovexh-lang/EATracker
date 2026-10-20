# 产品需求与开发规格书：Steam 抢先体验游戏"是否已弃坑"检查器

> 文档版本：v1.0　日期：2026-10-19（UTC+8）
> 用途：整份复制给 ChatGPT（或任何代码助手），让它按本规格完成网站开发。
> 语言约定：文档用简体中文；代码标识符、URL、SEO 关键词、网站 UI 文案一律用英文。

---

## 0. 直接粘贴给 GPT 的提示词

```text
You are a senior full-stack developer, data engineer and technical SEO specialist. Build a
production-ready website exactly per the specification below (the spec is written in Simplified
Chinese; all code, identifiers, URLs and user-facing UI copy must be in English).

Product: "Is [game] abandoned?" — a programmatic-SEO site with one page per Steam Early Access game.
Each page shows how long ago the developer last shipped an update or posted an announcement, the update
cadence over time, how long the game has been in Early Access, an automated status
(Active / Slowing down / Stalled / Likely abandoned / Left Early Access / Not enough data) with the
reasons behind it, plus rankings and lists (e.g. "longest in Early Access", "abandoned Early Access
games"). Data comes from public Steam endpoints and is refreshed on a schedule.

Hard requirements:
- Next.js (App Router) + TypeScript + Tailwind CSS on Vercel; Postgres (Neon) with Drizzle ORM;
  a separate TypeScript crawler (`/crawler`) run by GitHub Actions on a cron schedule, which writes to
  Postgres and then triggers on-demand revalidation of changed pages.
- Use exactly the endpoints, parameters and parsing rules in section 6 (they were verified on
  2026-10-19). Respect the rate limits there: a global token-bucket limiter per host, exponential
  backoff on 429/403, resumable jobs, idempotent upserts. Never hammer Steam.
- The status is a transparent, deterministic rule set (section 8.3); the page must show the exact
  signals and dates used. Wording must be neutral ("No developer update in 14 months"), never
  accusatory. Missing data => "Not enough data", never a guess.
- Programmatic pages, list pages, title/meta templates, JSON-LD and segmented sitemaps exactly as in
  section 9, with noindex rules for thin pages.
- Show "Not affiliated with Valve or Steam" and link every game to its Steam store page.
- Follow the acceptance criteria in section 14 and the milestone plan in section 15. At the end of
  each milestone, output the full file tree and all changed files, and list what you tested.
- If anything in the spec is ambiguous, choose the simplest robust option, state the assumption in a
  comment, and continue.

Specification follows:
```

（把上面这段连同下面整份文档一起粘贴给 GPT。）

---

## 1. 背景与证据

**问题**：Steam 上有大量抢先体验（Early Access）游戏开发停滞，但 Steam 不方便看出"上次更新是什么时候"。玩家买之前想知道"这游戏是不是被弃坑了"。

**Reddit 证据**（数据来自 Arctic Shift 公开归档，点赞数可能与线上略有出入）：
- r/pcgaming：*"Nearly 7,000 Early Access games on Steam haven't been updated in over a year"* — https://www.reddit.com/r/pcgaming/comments/1x1t7os/ ，**4009 赞 / 487 评**（2026-10-10）
  - 评论（1848 赞）："I'm so burnt out on early access that I won't even look at their store page once I find out it's early access."
  - 评论（658 赞）："I wonder how many of those games just got a 1.0 slapped on an unready product and the developer just called it a day."
- r/pcgaming 更早的帖子（ID 1sp60m8）："Why doesn't steam easily show you when a game was last updated? You need to dig into multiple menu's to find out if an early access game has been abandoned or not."，说明这是反复出现的抱怨。

**启示**：
1. 不只要显示"多久没更新"，还要显示"转正后是否还在更新"（回应 658 赞那条评论）→ 转正游戏也保留页面。
2. 玩家需要的是一个**快速结论 + 依据**，而不是原始数据表。

## 2. 竞品

| 竞品 | 形态 | 我们的差异 |
|---|---|---|
| SteamElixir.com/is | "is it still being updated" 页面，约 1401 款，以热门为主 | 我们覆盖全部抢先体验游戏（1 万多款），含冷门长尾 |
| Steam 商店页自带"超过 12 个月未更新"提示 | 只有一个阈值提示 | 我们给出时间线、频率、开发者沟通、状态理由 |
| SteamDB 及其扩展 | 数据全，但面向硬核用户，没有"弃坑"结论 | 结论导向、面向普通玩家搜索 |
| "Early Access Watcher" 等 Steam 鉴赏家列表 | 人工列表 | 自动化、全量、每天更新 |

判断：**竞争中偏低**。冷门抢先体验游戏的长尾页基本没人做。

## 3. 目标用户

1. 正在考虑购买某款抢先体验游戏的 PC 玩家（主力，搜索 "is X abandoned"）。
2. 已经买了、想知道还会不会更新的玩家（搜索 "X last update"、"is X still being updated"）。
3. 喜欢看排行榜、吐槽内容的玩家和媒体（"longest early access games"，可以带来外链）。

## 4. 核心价值

- 首页 H1："**Is That Early Access Game Abandoned?**"；副标题："We track every Steam Early Access game's updates and developer posts, daily."
- 每个游戏页首屏一句话结论，例如 "**Likely abandoned** — no patch or developer post for 19 months (last: Mar 3, 2025)."

## 5. 功能列表与优先级

### MVP（P0）
| 编号 | 功能 | 说明 |
|---|---|---|
| F1 | 游戏库 | 收录当前全部抢先体验游戏 + 我们追踪期间转正的游戏 |
| F2 | 游戏页 | 状态徽章、结论句、关键日期、更新时间线图（按月统计公告和补丁数）、最近 10 条开发者公告（标题 + 日期 + 链接到 Steam）、评测摘要、Steam 商店链接 |
| F3 | 状态算法 | 8.3 的确定性规则 + 0–100 的 `activityScore` |
| F4 | 搜索 | 首页和导航栏的游戏名搜索（自动补全） |
| F5 | 列表页 | Abandoned / Longest in Early Access / Recently updated / Recently left Early Access / 按类型（genre/tag） |
| F6 | 定时抓取 | 每日增量 + 每周全量（见 6.6） |
| F7 | 程序化 SEO | 每个游戏一页 + 列表页 + sitemap 分片 |
| F8 | 更正入口 | "Developer? Report incorrect data" 表单（开发者可以提交路线图链接，例如 "我们在外部博客更新"） |
| F9 | 法务与方法论 | `/methodology` 公开规则，另有隐私、条款、关于 |

### 后续（P1/P2）
- P1：评测文本中 "abandoned" 等关键词的提及频率（用 appreviews 拉最近评测）。
- P1：开发者页：同一开发者的其他游戏的弃坑记录（"Developer track record"）。
- P1：邮件或 RSS 提醒："你关注的游戏有更新了 / 进入 Stalled 了"。
- P1："Similar games that are still active" 推荐位（带联盟链接）。
- P2：嵌入小部件（开发者或媒体可以嵌入状态徽章 → 外链）。
- P2：多语言（西语、葡语、德语、俄语、简中），游戏名用 Steam 本地化名称。

## 6. 数据来源与接口（2026-10-19 已实测）

> 所有时间戳都是 Unix 秒（UTC）；入库存 `timestamptz`，页面按 UTC 日期显示（例如 "Mar 3, 2025"）。

### 6.1 商店详情 appdetails（非官方公开接口）
- `GET https://store.steampowered.com/api/appdetails?appids={appid}&cc=us&l=english`
- 实测返回字段：`type, name, steam_appid, required_age, is_free, short_description, header_image, capsule_image, website, developers, publishers, price_overview, platforms, metacritic, categories, genres, release_date, recommendations, content_descriptors, ratings` 等。
- **判断是否抢先体验**：`genres` 里有 `{ "id": "70", "description": "Early Access" }`。实测：Manor Lords（1363080）、Path of Exile 2（2694490）当前包含 id 70；Enshrouded（1203620）已转正，`genres` 中不再有 70。
- **`release_date.date`**：抢先体验期间是**抢先体验开始日期**（Manor Lords 显示 "Apr 26, 2024"）；转正后变成**正式版日期**（Enshrouded 显示 "Oct 15, 2026"）。所以第一次抓到时就要把 EA 开始日期存下来，不能以后再回头取。`release_date.coming_soon = true` 的未发售游戏不收录。
- `type` 只收 `game`（排除 dlc、demo、music 等）。下架或失效的 app 返回 `{"<appid>":{"success":false}}`。
- **限制**：一次只查一个 appid（多个 appid 只在 `filters=price_overview` 时可用，否则返回 null、HTTP 400，实测也是如此）。社区实测限流约 **200 次 / 5 分钟 / IP**，超出返回 429，继续请求会变成 403。我们的预算：**每 2 秒 1 次，burst = 1**。
- `filters=basic,genres,...` 实测并没有缩小返回内容，不要依赖它。

### 6.2 开发者新闻 GetNewsForApp（官方 Web API，免 Key）
- `GET https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid={appid}&count=100&maxlength=300&feeds=steam_community_announcements`
- 参数：`count`（条数）、`maxlength`（正文截断长度，0 = 全文）、`enddate`（Unix 秒，取此时间之前的，用于翻页）、`feeds`（逗号分隔的 feed 名）。
- 实测返回：`appnews.count`（总数），`appnews.newsitems[]`，每条有 `gid, title, url, is_external_url, author, contents, feedlabel, date, feedname, feed_type, appid, tags?`。
- **关键过滤**：不加 `feeds` 时，结果里会混入外部媒体文章（实测 Valheim 的新闻中有 "PlayGround.ru"，`feed_type = 0`）。只有 `feedname = "steam_community_announcements"`（`feed_type = 1`）才是开发者自己发的。实测 `feeds=steam_community_announcements` 参数有效。
- **补丁识别**：`tags` 包含 `"patchnotes"`（实测 "Patch 1.0.20" 带此标签）→ 记为补丁；另外标题正则 `/\b(patch|hotfix|update|v?\d+\.\d+(\.\d+)?|changelog|build)\b/i` 作为辅助，标为 `isPatchHeuristic`。
- 翻页：用最后一条的 `date - 1` 作为 `enddate` 继续请求，直到取完或早于 EA 开始日期。
- 官方 Web API 条款：**每天 10 万次调用上限**（https://steamcommunity.com/dev/apiterms ）。

### 6.3 评测摘要 appreviews（非官方公开接口）
- `GET https://store.steampowered.com/appreviews/{appid}?json=1&language=all&purchase_type=all&num_per_page=0`
- 实测返回 `query_summary: { num_reviews, review_score, review_score_desc, total_positive, total_negative, total_reviews }`。
- P1：`filter=recent&num_per_page=100&cursor=*` 翻页取最近评测文本，统计 "abandoned|dead game|no updates" 出现次数。和 appdetails 一样属于 store.steampowered.com，**共享同一个限流预算**。

### 6.4 构建更新时间（第三方，可选但很有价值）
- `GET https://api.steamcmd.net/v1/info/{appid}`（第三方服务，基于 Steam PICS 数据，**非 Valve 官方**）
- 实测（Manor Lords）：`data.{appid}.depots.branches.public = { buildid, timebuildupdated, timeupdated }`，例如 `timeupdated: 1787846430`（2026-08-28 UTC）；`data.{appid}.common.genres` 中也有 `"70"`；`common.steam_release_date = 1714136362`（2024-04-26 UTC，即 EA 开始日期）。
- 用途：捕获"**没发公告、但偷偷推了新版本**"的情况，这是判断是否弃坑最直接的信号。
- 风险：第三方服务可能限流或下线。要做成可选信号：拿不到时状态算法照样能运行；请求要慢，每秒不超过 1 次；页面注明 "Build data via steamcmd.net"。

### 6.5 抢先体验游戏清单（种子）
三个来源合并，最后都要用 appdetails 的 genre 70 确认：
1. **Steam 商店搜索**（非官方）：`GET https://store.steampowered.com/search/results/?query&start={offset}&count=100&infinite=1&tags=493&category1=998&cc=us&l=english`。返回 JSON `{ success, total_count, results_html }`，用正则 `data-ds-appid="(\d+)"` 提取 appid。实测 `total_count = 14543`；其中**包含已转正的游戏**（第一个结果就是 PUBG），所以必须二次确认。（`tags=493` 是 Early Access 用户标签，`category1=998` 表示只要游戏。另外 `genre=70` 参数实测不生效。）
2. **SteamSpy**：`GET https://steamspy.com/api.php?request=tag&tag=Early+Access`。实测返回 16503 个 app，同样包含已转正的游戏。字段有 `appid, name, developer, publisher, positive, negative, owners, ccu, price`。SteamSpy 要求每秒不超过 1 次请求。可以用 `ccu`、`positive` 给抓取排优先级。
3. **全量 app 列表**（检测新游戏）：`GET https://api.steampowered.com/IStoreService/GetAppList/v1/?key={STEAM_WEB_API_KEY}&max_results=50000&last_appid={n}&if_modified_since={unix}`，**需要 Web API Key**（无 Key 实测返回 403）。返回的 app 带 `last_modified`。旧的 `ISteamApps/GetAppList/v2` 已废弃（实测 404，2025-11 起）。Key 只能放在 GitHub Actions secrets 里，绝不能暴露给前端。

### 6.6 抓取调度（GitHub Actions）
| 任务 | 频率 | 内容 | 预估调用量 |
|---|---|---|---|
| `discover` | 每天 1 次 | 用 GetAppList（`if_modified_since` = 上次运行时间）+ 商店搜索前 5 页（按发售日期排序），找新 app 和有变动的 app | < 500 |
| `refresh-hot` | 每天 1 次 | 状态为 Active/Slowing，或 SteamSpy `ccu` 前 2000 的游戏：GetNewsForApp + steamcmd | 约 2000–4000 次（Web API） |
| `refresh-store` | 每天，滚动 | appdetails + appreviews：每天处理约 1/7 的游戏（1 万多款 ÷ 7 ≈ 1500–2000 款 × 2 次请求，按每 2 秒 1 次约需 2 小时） | 约 4000 次（store） |
| `refresh-all-news` | 每周 1 次 | 全部游戏的 GetNewsForApp | 约 1.5 万次（Web API） |
| `rescore` | 每次抓取后 | 重新算状态和分数；对 `status` 或 `lastActivityAt` 变化的游戏调用 `POST /api/revalidate`（带 secret）→ `revalidateTag('game:{appid}')` | — |

- **首次全量导入**：1.5 万左右个候选 appid × appdetails，每 2 秒 1 次，约 8–9 小时。分多次 Actions 运行（单个 job 最长 6 小时），按 `crawl_state` 表断点续跑。
- GitHub Actions：公开仓库免费分钟数不限；私有仓库免费额度每月 2000 分钟，不够的话把爬虫仓库单独设成公开（不含 secrets），或付费。
- 不用 Vercel Cron 跑抓取（函数时长有限）。Vercel 只负责页面和 revalidate 接口。
- 每个 HTTP 请求：超时 20 秒；429 → 等待 5 分钟；403 → 停止该 host 的任务 30 分钟并告警；User-Agent 写明站点和联系邮箱。

## 7. 页面列表与 URL 结构

| URL | 页面 | 生成 |
|---|---|---|
| `/` | 首页：搜索框、统计数字（"10,482 Early Access games tracked, 6,9xx with no update in 12+ months"）、各列表入口 | ISR（1 天） |
| `/game/[slug]` | 游戏页，slug = 游戏名 slug（例如 `/game/manor-lords`）；重名时加 appid（`/game/foo-1234567`） | 热门前 2000 款在构建时生成，其余按需 ISR；`revalidate: 86400` + 按需 revalidate |
| `/app/[appid]` | 301 → `/game/[slug]`（方便从 Steam appid 直接访问） | 动态 |
| `/abandoned-early-access-games` | 疑似弃坑列表（分页、可按类型和价格筛选） | ISR |
| `/longest-early-access-games` | 抢先体验时长排行 | ISR |
| `/recently-updated-early-access-games` | 最近更新 | ISR（6 小时） |
| `/left-early-access` | 最近转正的游戏（及其转正后的更新情况） | ISR |
| `/genre/[genre]` | 按类型列出，例如 `/genre/survival` | ISR |
| `/stats` | 全站统计（可做媒体引用的数据页：每年进入和转正的游戏数等） | ISR |
| `/methodology` | 状态规则、数据来源、刷新频率 | SSG |
| `/report` | 更正表单 | 动态 |
| `/privacy` `/terms` `/about` `/contact` | 法务 | SSG |

## 8. 详细功能规格

### 8.1 游戏页布局（从上到下）
1. 头图（Steam `header_image`）+ 游戏名 + 开发商 + 价格 + "View on Steam" 按钮。
2. **状态徽章 + 结论句**：例如 "Stalled — last developer post 7 months ago (Mar 3, 2026). Last patch: Jan 12, 2026."
3. 关键数字卡片：In Early Access for（例如 "2 years 6 months"）、Last patch、Last developer post、Last build update（若有）、Updates in last 12 months、Steam reviews（例如 "Very Positive (92%)"）。
4. "Why this status?" 列表：逐条列出触发规则的信号和日期。
5. 更新时间线：最近 36 个月，每月柱状图（补丁、公告两种颜色）；用 SVG 或 Recharts。
6. 最近 10 条开发者公告：标题、日期、`tags`、链接到 Steam 原文（不转载全文，只显示 `maxlength=300` 的摘要）。
7. FAQ 区（同时输出 FAQPage schema），由数据自动生成："Is {game} abandoned?"、"When was {game} last updated?"、"How long has {game} been in Early Access?"、"Will {game} leave Early Access?"（只陈述开发者公开过的信息，没有就答 "The developer hasn't announced a 1.0 date on Steam."）。
8. Similar Early Access games that are still active（同类型、Active 状态，最多 6 个）。
9. 免责与更正："Status is calculated automatically from public Steam data. Developer? Report incorrect data."

### 8.2 派生字段（每次 rescore 计算）
- `eaStartDate`：首次发现时，若在抢先体验中，取 `release_date.date` 解析；也可用 steamcmd `common.steam_release_date`；两者都没有就为 null。
- `lastPatchAt`：最近一条带 `patchnotes` 标签的开发者公告日期（启发式匹配的单独存为 `lastPatchHeuristicAt`）。
- `lastDevPostAt`：最近一条开发者公告（`feed_type = 1`）的日期。
- `lastBuildAt`：steamcmd 的 `branches.public.timeupdated`。
- `lastActivityAt = max(lastPatchAt, lastBuildAt, lastDevPostAt)`；`lastShipAt = max(lastPatchAt, lastBuildAt)`（真正推了版本）。
- `posts12m`、`patches12m`：过去 365 天的公告数、补丁数。
- `eaDurationDays = today - eaStartDate`。
- `leftEarlyAccessAt`：上次抓取时还有 genre 70，这次没有了 → 记录当天日期（只能精确到抓取周期）。

### 8.3 状态规则（确定性规则，按顺序判断）
1. 当前不再有 genre 70，且我们曾记录它在 EA 中 → `left_early_access`（另外显示转正后的更新情况："Updated 3 times since 1.0"）。
2. `lastActivityAt` 为 null（既没有公告也没有构建数据）→ `not_enough_data`。
3. `daysSince(lastShipAt) <= 90` 或 `daysSince(lastDevPostAt) <= 60` → `active`。
4. `daysSince(lastActivityAt) <= 180` → `slowing`。
5. `daysSince(lastActivityAt) <= 365` → `stalled`。
6. `daysSince(lastActivityAt) > 365` → `likely_abandoned`。
- 特例：只有开发者公告、没有补丁和构建更新，且最后一次真正更新超过 365 天 → 最高只能是 `stalled`，"Why" 里注明 "Developer posted recently, but no game update in {n} months."。
- 阈值放在 `config/status.ts`，并在 `/methodology` 页面原样展示。
- `activityScore`（0–100，用于排序）：`40 × recency(lastShipAt) + 25 × recency(lastDevPostAt) + 20 × min(patches12m / 12, 1) + 15 × min(posts12m / 12, 1)`；`recency(d) = max(0, 1 − daysSince(d) / 540)`；缺失项按 0 计，并在页面注明。

### 8.4 文案原则
- 中性、可验证："No developer post or patch on Steam in 14 months"；**不说** "the developer scammed players"。
- `likely_abandoned` 的徽章旁边固定一行小字："Based on Steam activity only. Some developers post updates elsewhere."
- 开发者通过 `/report` 提交外部更新渠道并经人工核实后，可以加上 `externalUpdatesUrl`，并在页面显示 "Developer says updates are posted at …"。此时状态最多降级到 `slowing`。

### 8.5 边界情况
- 游戏下架或 appdetails 返回 `success: false`：保留页面，显示 "No longer available on the Steam store"，`noindex`。
- 改名：以 appid 为主键；slug 变化时旧 slug 301 到新 slug（`slug_history` 表）。
- 成人内容：`content_descriptors.ids` 含 3 或 4（成人色情内容，**ID 含义需再次核实**）的游戏不生成可索引页面（保护 AdSense 资质）。
- 未发售（`coming_soon`）：不收录，转为 EA 后再收录。
- 免费游戏、价格缺失：`price_overview` 不存在时显示 "Free" 或 "—"。
- 公告很多的游戏（几千条）：只翻页到 EA 开始日期或最近 3 年为止。
- 时间戳异常（未来日期、0）：丢弃并记日志。
- 同一 appid 的 Demo、Playtest：按 `type` 过滤掉。

## 9. SEO 方案

### 9.1 关键词（来自调研，未查搜索量）
- 程序化：`is [game] abandoned`、`is [game] still being updated`、`[game] last update`、`is [game] dead`、`[game] early access release date`、`will [game] leave early access`、`[game] 1.0 release`
- 列表：`abandoned early access games list`、`early access games never finished`、`longest early access games`、`early access games that got abandoned`、`best early access games still being updated`
- 潜在规模：1 万多款抢先体验游戏，每款一页。

### 9.2 Title / Meta 模板
- 游戏页：`Is {Game} Abandoned? Last Update {Mon YYYY} ({Status})`（≤ 60 字符，超长时去掉括号部分）
- meta：`{Game} has been in Early Access for {duration}. Last patch: {date}. Last developer post: {date}. Updated {n} times in the past year. Status: {Status}.`
- H1：`Is {Game} Abandoned?`；首段即结论句（方便被抓成摘要）。
- 列表页：`{N} Abandoned Early Access Games on Steam ({Month YYYY})`，每月自动更新数字。

### 9.3 结构化数据
- 游戏页：`VideoGame`（`name`、`gamePlatform: "PC"`、`author`/`publisher`、`url`、`image`、`dateModified`；**不加 `aggregateRating`**，Steam 的评测数据不是本站用户评分，加了有被判定违规的风险）+ `FAQPage` + `BreadcrumbList`。
- 列表页：`ItemList`。

### 9.4 索引控制与 sitemap
- `noindex` 规则：`not_enough_data`、已下架、成人内容、评测数 < 10 **且**公告数 < 3 的极冷门游戏（防止大量薄内容页拖累全站）。上线后观察 Search Console，再逐步放开。
- sitemap 分片：`/sitemaps/games-1.xml` …（每片 ≤ 5000 条），加 `/sitemaps/lists.xml`、`/sitemap.xml` 索引；`lastmod` = `max(lastActivityAt, statusChangedAt)`，**不要每天把所有页面的 lastmod 都改成当天**。
- 内链：游戏页 → 类型页、相似游戏；列表页 → 游戏页；首页 → 各列表。
- 上线顺序：先放 2000 个数据最完整的游戏页 + 全部列表页；收录稳定后每周增加约 2000 页。
- i18n（P2）：`/de/game/...` 等，`hreflang`，游戏名用 `l=german` 等参数获取本地化名称。

## 10. 推荐技术栈

- Web：Next.js 15+（App Router）+ TypeScript + Tailwind CSS + shadcn/ui；图表用 Recharts 或手写 SVG。
- 数据库：Postgres（Neon，免费层起步），Drizzle ORM；搜索用 Postgres `pg_trgm` 或构建时导出的 `fuse.js` 轻量索引（只含 name、slug、appid）。
- 爬虫：`/crawler` 目录，Node 20 + TypeScript，`undici`、`p-queue`（每个 host 一个限流器）、`zod` 校验接口返回；GitHub Actions `schedule` 定时触发。
- 图片：直接用 Steam CDN 的 `header_image` URL，配 `next/image`，在 `remotePatterns` 中加入 `shared.akamai.steamstatic.com`、`cdn.akamai.steamstatic.com`。（注意 Vercel 图片优化有额度，可以设 `unoptimized`。）
- 部署：GitHub → Vercel。⚠️ Vercel Hobby 计划限非商业用途，带广告和联盟链接应使用 Pro 计划。
- 监控：爬虫运行结果写 `crawl_runs` 表；失败率 > 10% 时 GitHub Actions 失败并发邮件。

## 11. 数据模型（Drizzle / SQL 概要）

```sql
games (
  appid int primary key,
  name text not null, slug text unique not null,
  type text, is_free bool, price_cents int, currency text,
  developers text[], publishers text[], genres text[], tags text[],
  header_image text, short_description text,
  is_early_access bool not null,
  ea_start_date date, left_ea_at date,
  release_date_raw text, coming_soon bool,
  review_score_desc text, total_positive int, total_negative int, total_reviews int,
  adult bool default false, delisted bool default false,
  external_updates_url text,
  first_seen_at timestamptz, store_checked_at timestamptz, news_checked_at timestamptz,
  build_checked_at timestamptz
);

news_items (
  gid text primary key, appid int references games,
  title text, url text, date timestamptz, feedname text, feed_type int,
  tags text[], is_patch bool, is_patch_heuristic bool, excerpt text
);

builds (appid int references games, buildid text, time_updated timestamptz,
        primary key (appid, buildid));

game_status (
  appid int primary key references games,
  status text,              -- active | slowing | stalled | likely_abandoned | left_early_access | not_enough_data
  activity_score int,
  last_patch_at timestamptz, last_dev_post_at timestamptz, last_build_at timestamptz,
  last_activity_at timestamptz, posts_12m int, patches_12m int, ea_duration_days int,
  reasons jsonb,            -- [{ code: "no_patch_days", value: 412, date: "2025-08-30" }]
  indexable bool, status_changed_at timestamptz, computed_at timestamptz
);

slug_history (old_slug text primary key, appid int);
crawl_state (job text, cursor text, updated_at timestamptz, primary key (job));
crawl_runs (id serial, job text, started_at timestamptz, finished_at timestamptz,
            ok int, failed int, notes text);
reports (id serial, appid int, kind text, url text, message text, email text,
         created_at timestamptz, status text);
```

## 12. 变现

- **广告**：AdSense（流量起来后换 Mediavine、Raptive，游戏类 RPM 中等）。游戏页的结论卡片和关键数字区不放广告。
- **联盟**：正版 Key 商城，Humble Bundle、Fanatical、Green Man Gaming 都有联盟计划（所属平台和佣金**待核实**，可能是 Impact 或自有平台）。放在 "Similar active games" 推荐位和 "Where to buy" 按钮上；要为每款游戏匹配对应商城的商品页（P1，可以借助 IsThereAnyDeal API，需申请 Key）。
- **不要**在"疑似弃坑"游戏的页面推荐购买这款游戏本身。
- 数据页 `/stats` 和年度报告（"Early Access in 2026"）用于争取媒体引用和外链。

## 13. 隐私与法律

- Steam Web API 条款（https://steamcommunity.com/dev/apiterms ）要点：每天 10 万次调用上限；Key 保密；数据按 "as is" 提供并附免责；**不能让人误以为本站得到 Valve 或 Steam 的认可或与其有关联**；不得影响 Steam 的运行。
- 页脚固定写："Data from public Steam APIs. Not affiliated with or endorsed by Valve Corporation. Steam and the Steam logo are trademarks of Valve Corporation."
- **域名不要带 "steam"**（Valve 商标），避免投诉。
- store.steampowered.com 的 appdetails、search、appreviews 是非官方公开接口，没有正式授权条款：保持低频、缓存、可随时停用；如果被屏蔽，降级为只用官方 Web API（GetNewsForApp）和 SteamSpy。
- steamcmd.net 与 SteamSpy 是第三方服务：注明来源，遵守它们的频率要求。
- 游戏头图、名称版权属于各开发商和发行商，只做识别用途，并链接回 Steam。
- 弃坑判断文案中性，附依据和更正渠道，降低开发者投诉和名誉纠纷风险；对开发者的更正请求 72 小时内处理。
- 隐私：不收集用户的 Steam 账号数据；只有更正表单（邮箱选填）和匿名统计。若接 AdSense，需配 Cookie 同意（欧盟、英国用 Google 认证的 CMP）。
- 联盟链接旁加 FTC 披露。

## 14. 验收标准清单

- [ ] 爬虫在 GitHub Actions 中能断点续跑；首次全量导入完成后，`is_early_access = true` 的游戏数量与 Steam 商店搜索 `tags=493` 的结果剔除已转正游戏后的数量大致相符（差距 < 10%）。
- [ ] 抽查 30 个游戏（含 10 个冷门的），`lastPatchAt`、`lastDevPostAt`、`eaStartDate` 与 Steam 商店页一致。
- [ ] 外部媒体新闻（`feed_type = 0`）不计入开发者公告。
- [ ] 限流：日志显示 store.steampowered.com 请求 ≤ 每 2 秒 1 次；遇到 429 能退避；Web API 每日调用 < 10 万。
- [ ] 状态规则有单测：6 种状态 + 特例（只有公告没有补丁）+ 缺数据，全部通过。
- [ ] 游戏页显示 "Why this status?"，且每条理由都有日期。
- [ ] 某游戏状态变化后，对应页面在下一次抓取后 1 小时内更新（按需 revalidate 生效）。
- [ ] 旧 slug 301 到新 slug；`/app/{appid}` 301 正确。
- [ ] noindex 规则生效；sitemap 分片 ≤ 5000 条，只包含可索引页面，`lastmod` 不会每天全量变化。
- [ ] JSON-LD（VideoGame、FAQPage、BreadcrumbList、ItemList）通过 Rich Results Test，没有 `aggregateRating`。
- [ ] 页脚有 Valve 免责声明；每个游戏都链接 Steam 商店页。
- [ ] Lighthouse 移动端 Performance ≥ 90、SEO = 100；游戏页 LCP < 2.5s。
- [ ] 更正表单可用（带 Turnstile 防垃圾提交），提交内容写入 `reports` 表。

## 15. 开发里程碑

| 阶段 | 内容 | 预计 |
|---|---|---|
| M0 | 申请 Steam Web API Key（https://steamcommunity.com/dev/apikey ）；创建 Neon 数据库；GitHub 仓库与 Vercel 项目；配置 secrets | 0.5 天 |
| M1 | 数据库 schema + Drizzle 迁移；爬虫框架（限流、重试、断点续跑、zod 校验）；单个 appid 端到端：appdetails → news → reviews → steamcmd → 入库 | 1.5 天 |
| M2 | 种子发现（商店搜索 + SteamSpy + GetAppList）；首次全量导入（后台跑约 8–9 小时，可能分多次） | 1 天 + 等待 |
| M3 | 派生字段 + 状态规则 + 分数 + 单测；`/methodology` 页 | 1 天 |
| M4 | 游戏页（全部区块）、搜索、首页 | 2 天 |
| M5 | 列表页、类型页、stats 页；sitemap 分片、noindex 规则、JSON-LD、OG 图 | 1.5 天 |
| M6 | 定时任务（每日、每周）+ 按需 revalidate；监控告警 | 1 天 |
| M7 | 更正表单、法务页、验收清单、Lighthouse；上线首批 2000 页，提交 Search Console | 1 天 |
| 之后 | 每周增加约 2000 个可索引页；P1 评测关键词、开发者页、提醒、联盟推荐位 | 持续 |

合计约 9–10 个工作日（不含首次全量导入的等待时间）。

## 16. 域名建议（未查询可注册性）

1. `isitabandoned.com`
2. `stillupdating.com`
3. `eatracker.gg`

（都不含 "steam"。"Early Access Watcher" 已经是一个鉴赏家列表的名字，避免用相近的名字。）

## 17. 待核实事项

1. 商店搜索接口 `search/results/?infinite=1` 和 appdetails 都是非官方接口，格式和限流随时可能变化（2026-10-19 实测可用）。
2. steamcmd.net 的稳定性和频率限制（没有找到官方说明），所以只作为可选信号。
3. `content_descriptors` 中成人内容对应的 ID。
4. Humble、Fanatical、GMG 联盟计划的平台和佣金。
5. "近 7000 款一年以上未更新" 是 Reddit 帖子引用的数字，我们自己的统计口径（只算 Steam 公告和构建更新）可能得出不同结果，`/stats` 页要写明统计口径。
