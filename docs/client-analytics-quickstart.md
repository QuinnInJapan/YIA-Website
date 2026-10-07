# YIA サイトの利用状況 / Website analytics quickstart

[ダッシュボードを開く / Open the dashboard](https://analytics.google.com/analytics/web/#/a411111889p557873278/reports/builder/16057323333)

Google Analytics の「YIA Website」で、**レポート → カスタム ダッシュボード →
YIA サイトの利用状況 / Website overview** を開いてください。このページを
ブックマークすると、次回から直接開けます。既存の閲覧権限が必要です。

In Google Analytics, select **YIA Website → Reports → Custom dashboards →
YIA サイトの利用状況 / Website overview**. Bookmark the link above. It uses your
existing Google Analytics access; creating this dashboard did not invite anyone.

上段は訪問者と訪問回数、中段は流入元と人気ページ、下段は資料と申込リンクです。
棒の長さと人気ページの表で比較できます。 / Read from top to bottom: visitors and visits,
traffic sources and popular pages, then document opens and application interest.
Compare bar lengths for sources and actions; the page table keeps long Japanese
titles readable beside their view counts. Each card states what it counts.

## 毎月の確認 / A simple monthly review

1. 月末から48時間以上待ち、右上で前月の1日〜末日を選びます。 / Wait at least
   48 hours after month end, then select the previous full calendar month with
   the date control at the top right. Report dates use Japan time.
2. 訪問者と訪問回数を確認します。 / Check visitors and visits, then compare with
   the preceding month using the same report and a comparable date range.
3. 人気ページ、流入元、申込リンク、資料を確認します。 / Look at popular pages,
   traffic sources, application links and documents. Note which programs attract
   interest and which sources bring visitors.

月次報告は「何人が来たか」「何に関心があったか」「次に何を改善するか」の3点で
十分です。 / A useful monthly note answers: how many people visited, what they
were interested in, and what to improve next.

初回は2026年10月7日以降を選びます。10月は途中からの計測なので、未計測の9月と
比較しないでください。最初の全月データは11月です。 / For the launch review,
select dates starting on 7 October 2026. October is a partial month; September
was not measured. November is the first full calendar month. Compare periods
with similar lengths, and note holidays, campaigns and content changes.

## 数字の読み方 / What the numbers mean

| ダッシュボード / Card                                       | Meaning                                                                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 訪問者 / Visitors                                           | アクティブ ユーザー。期間中に利用した人の推定数。 / Estimated active users in the selected period.                                                   |
| 訪問回数 / Visits                                           | セッション。同じ人が別の日に戻ると複数回になります。 / Sessions; one person can make several visits.                                                 |
| 人気ページ（表示回数） / Popular pages                      | 表示回数。繰り返し閲覧も含みます。 / Page views, including repeat views, grouped by page title.                                                      |
| 訪問のきっかけ（訪問回数） / Traffic sources                | 検索・SNS・他サイトなどからの訪問回数。 / Visits from search, social, other sites and other channels. “Direct” means GA could not identify a source. |
| 申込リンク選択（完了ではありません） / Application interest | Google Forms へのリンクを選んだ回数。申込完了ではありません。 / Clicks on Google Forms links, including repeat clicks; not completed applications.   |
| 資料を開いた回数 / Document opens                           | 資料リンクやプレビューを開いた回数。読了ではありません。 / Document-link or preview opens, including repeat clicks; not proof of reading.            |

実際の申込数は Google Forms の回答を別途確認してください。問い合わせフォームは
送信先の設定が完了するまで、問い合わせ成功数の指標として使えません。

Count completed applications in Google Forms separately. The website contact
form still needs a real submission destination before successful inquiries can
be used as a meaningful metric.

## 端末・地域・言語 / Devices, locations and languages

[利用者の傾向を開く / Open the audience dashboard](https://analytics.google.com/analytics/web/#/a411111889p557873278/reports/builder/16057494145)

**レポート → カスタム ダッシュボード → YIA 利用者の傾向 / Audience overview**
で確認できます。右上で期間を選び、棒の長さを比較します。すべてのカードは
アクティブ ユーザー数です。 / Open **Reports → Custom dashboards →
YIA 利用者の傾向 / Audience overview**. Select the same date range as the website
overview. All six charts compare estimated active users, rather than clicks.

| Card / カード                       | What it shows / 読み方                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 端末の種類 / Devices                | `mobile` = スマートフォン、`desktop` = パソコン、`tablet` = タブレット。 / Phone, computer and tablet traffic.                                    |
| 国・地域 / Countries                | アクセス元の国の目安。国籍ではありません。 / Approximate countries of access, not nationality.                                                    |
| 都市の目安 / Cities (approx.)       | ネットワーク情報から推定した都市。住所や居住地ではありません。 / Estimated city of access, not an address or verified residence.                  |
| ブラウザー / Browsers               | Chrome、Safari など。 / Browsers used to visit the site.                                                                                          |
| OS / Operating systems              | iOS、Android、Windows、Macintosh など。 / Operating systems; Macintosh means Mac.                                                                 |
| ブラウザーの言語 / Browser language | ブラウザーの言語設定。サイトで選んだ翻訳言語や国籍ではありません。 / Browser language setting; separate from the website's translation selection. |

同じ利用者が複数の端末や地域に現れることがあります。カード同士の数や都市の
各行を足して総人数にしないでください。 / A measured user can appear in multiple
categories or cities during a period. Do not add charts or category rows together
to calculate a total audience. Early counts may change during processing.

位置情報は IP アドレスからの推定で、GPS は取得しません。VPN や通信会社の
経路などにより実際の位置と異なることがあります。`(not set)` は判別できない
値です。少数のデータが表示されない場合もあります。 / Geography is approximate
and inferred from IP information; this setup does not request GPS. VPNs and
network routing can affect it. `(not set)` means the value was unavailable.
Small groups may be withheld by GA's reporting protections where applicable.

既存の計測データを使う無料のレポートです。新しい Sanity ページも同じ集計に
含まれます。 / This free dashboard uses the existing measurement, including
new public Sanity pages after measured visits. It adds no website code, Vercel
function calls or deployment. Age, gender and advertising interests are outside
this dashboard; no additional demographic collection was enabled for this change.

端末の比率は表示確認の優先順位、言語の傾向は翻訳の見直し、地域の傾向は広報の
検討に使えます。少数の開始日データから結論を出さないでください。 / Use device
trends to prioritize display checks, language trends to review translations,
and location trends to inform outreach. Avoid decisions based on tiny launch-day
samples.

## 空欄や「データがありません」 / Empty reports

計測開始日は **2026年10月7日** です。それ以前のアクセスは遡って計測できません。
通常のレポートは反映まで24〜48時間かかることがあります。直近の確認には
「リアルタイムの概要」を使えます。操作されていないリンクや資料は空欄になります。

Collection went live on **7 October 2026**. It cannot reconstruct earlier visits.
Realtime usually updates within a few minutes. Standard reports often start
updating in 2–6 hours; allow 24–48 hours for processing, including newly registered
custom fields. Today's totals are provisional. For a settled short-term review,
end the date range at least two days ago. An unused link or document may have no
rows yet. Empty launch-day cards do not by themselves mean tracking is broken.
Cookie choices, browser blockers and repeat devices affect counts, so use trends
and comparisons rather than treating users as a complete attendance register.

QRリンクなど独自の媒体は「Unassigned」に入ることがあります。詳細レポートの
参照元・メディア・キャンペーンで確認できます。 / A custom medium such as `qr`
may appear under “Unassigned.” Check source/medium and campaign reports for the
specific flyer or campaign. Launch-day totals also include verification visits;
test filters are still in Testing mode and do not remove those visits.

## 詳細を調べる / More detail

The saved [Client action overview](https://analytics.google.com/analytics/web/#/analysis/a411111889p557873278/edit/9ucEP1KASwuF7pHh3955og)
is available to its current owner for actions by page, document names and link
placement. Standard **Tech details** reports offer further
device dimensions such as screen resolution; **Demographic details**
offers Region for prefecture/state-level investigation where available. Campaigns
remain in the traffic reports. The two client dashboards keep the common
questions together.

For a manual export, use the report/card menu's **Export / エクスポート** option
where available. Include the report name and date range when sharing results.
No scheduled export, paid connector or billing account is needed.

New published public pages from Sanity appear automatically after they receive
measured visits. Give each page a clear title; normal publishing and navigation
setup are sufficient. Editors do not need to add tracking code.
