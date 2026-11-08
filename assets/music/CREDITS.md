# 背景音樂出處（菊島連連烘）

四首曲子都出自 **Loyalty Freak Music** 的專輯《POSITIVE ATTITUDE !》（2017-09-20 發行，Folk／Instrumental／Soundtrack，專輯介紹：“Happy songs for happy people.”），授權都是 **CC0 1.0 Universal（公眾領域貢獻宣告）**。CC0 不要求署名，這裡仍列出作者與出處表示感謝。

下載日期：2026-11-08，來源：Free Music Archive（FMA）。

| 檔案 | 曲名 | 作者 | 遊戲中用途 | 曲目頁 |
|---|---|---|---|---|
| `ice-cream-with-you.m4a` | Ice Cream with you | Loyalty Freak Music | 首頁、地圖（`home`、`map`） | https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_05_Ice_Cream_with_you/ |
| `sweet-sun.m4a` | Sweet Sun | Loyalty Freak Music | 關卡（`level`，和下一首輪流） | https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_04_Sweet_Sun/ |
| `go-to-the-picnic.m4a` | Go to the Picnic | Loyalty Freak Music | 關卡（`level`，和上一首輪流） | https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_01_Go_to_the_Picnic/ |
| `yippee.m4a` | Yippee ! | Loyalty Freak Music | 過關（`clear`） | https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_/Loyalty_Freak_Music_-_POSITIVE_ATTITUDE__-_08_Yippee_/ |

專輯頁：https://freemusicarchive.org/music/Loyalty_Freak_Music/POSITIVE_ATTITUDE_

## 授權原文

各曲目頁上的授權文字（2026-11-08 擷取）：

> Ice Cream with you by Loyalty Freak Music is licensed under a CC0 1.0 Universal License.
>
> Sweet Sun by Loyalty Freak Music is licensed under a CC0 1.0 Universal License.
>
> Go to the Picnic by Loyalty Freak Music is licensed under a CC0 1.0 Universal License.
>
> Yippee ! by Loyalty Freak Music is licensed under a CC0 1.0 Universal License.

專輯頁：

> The songs in this album are licensed under: CC0 1.0 Universal

授權連結：https://creativecommons.org/publicdomain/zero/1.0/

## 本遊戲做的修改

原檔是 320 kbps MP3。為了縮小檔案、當背景音樂用，做了以下處理（CC0 允許修改）：

- 去掉頭尾的靜音，頭尾各加極短的淡入淡出（循環接回開頭時不會「啪」一聲）。
- 整體音量調小約 20 dB（平均響度約 −35 dBFS，最大聲約 −20 dBFS；音效最大聲約 −11～−22 dBFS），讓音樂不會蓋過音效。iPhone 不能用程式調 `<audio>` 的音量，所以音量直接做在檔案裡。
- 用 macOS 內建 `afconvert` 轉成 HE-AAC 40 kbps 的 m4a（每首 0.6～0.94 MB，四首合計約 2.9 MB）。
- 做法：`afconvert -f WAVE -d LEI16@44100 原檔.mp3 a.wav` → 用 Python（numpy）去頭尾靜音、乘上增益、頭 0.25 秒淡入、尾 0.6 秒淡出 → `afconvert -f m4af -d aach -b 40000 b.wav 成品.m4a`。想讓音樂大聲一點，就把目標響度從 −35 改成 −32 之類再做一次。

## 設定頁可用的製作資訊文字

> 背景音樂：Loyalty Freak Music〈Ice Cream with you〉〈Sweet Sun〉〈Go to the Picnic〉〈Yippee !〉，出自專輯《POSITIVE ATTITUDE !》，CC0 1.0 公眾領域授權，取自 Free Music Archive（freemusicarchive.org）。音效：遊戲內即時合成。
