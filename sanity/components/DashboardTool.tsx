"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { definePlugin, type Tool } from "sanity";
import { useClient } from "sanity";
import {
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Stack,
  Text,
  TextInput,
  Switch,
  Button,
  Inline,
  Label,
} from "@sanity/ui";
import {
  AddIcon,

  EditIcon,
  PinIcon,
  CheckmarkCircleIcon,
  TrashIcon,
  ImageIcon,
} from "@sanity/icons";
import createImageUrlBuilder from "@sanity/image-url";

// ── Types & helpers ───────────────────────────────────────

interface Announcement {
  _id: string;
  titleJa: string | null;
  titleEn: string | null;
  date: string;
  pinned: boolean;
}

const QUERY = `*[_type == "announcement" && !(_id in path("drafts.**"))] | order(pinned desc, date desc) {
  _id,
  "titleJa": title[_key == "ja"][0].value,
  "titleEn": title[_key == "en"][0].value,
  date,
  pinned
}`;

const STUDIO_BASE = "/studio";

function navigateStudio(path: string) {
  window.location.assign(`${STUDIO_BASE}/${path}`);
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ── Recent announcements ──────────────────────────────────

function RecentAnnouncements() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Draft state for expanded card
  const [draftTitleJa, setDraftTitleJa] = useState("");
  const [draftTitleEn, setDraftTitleEn] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftPinned, setDraftPinned] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  // Track whether drafts have been touched
  const [dirty, setDirty] = useState(false);

  // Inline create mode
  const [creating, setCreating] = useState(false);
  const [createTitleJa, setCreateTitleJa] = useState("");
  const [createTitleEn, setCreateTitleEn] = useState("");
  const [createDate, setCreateDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [createPinned, setCreatePinned] = useState(false);
  const [createStatus, setCreateStatus] = useState<SaveStatus>("idle");

  const fetchAnnouncements = useCallback(() => {
    client
      .fetch<Announcement[]>(QUERY)
      .then(setAnnouncements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Real-time listener
  useEffect(() => {
    const subscription = client
      .listen('*[_type == "announcement"]')
      .subscribe(() => {
        fetchAnnouncements();
      });
    return () => subscription.unsubscribe();
  }, [client, fetchAnnouncements]);

  // Ref to track dirty state for the confirm prompt
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  function markDirty() {
    setDirty(true);
    setSaveStatus("idle");
  }

  function expandCard(a: Announcement) {
    if (expandedId === a._id) {
      setExpandedId(null);
      setDirty(false);
      return;
    }
    if (dirtyRef.current && !window.confirm("未保存の変更があります。破棄しますか？")) {
      return;
    }
    setExpandedId(a._id);
    setDraftTitleJa(a.titleJa ?? "");
    setDraftTitleEn(a.titleEn ?? "");
    setDraftDate(a.date ?? "");
    setDraftPinned(a.pinned ?? false);
    setSaveStatus("idle");
    setDirty(false);
    setConfirmingDelete(null);
  }

  async function handleSave(id: string) {
    setSaveStatus("saving");
    try {
      await client
        .patch(id)
        .set({
          date: draftDate,
          pinned: draftPinned,
          'title[_key == "ja"].value': draftTitleJa,
          'title[_key == "en"].value': draftTitleEn,
        })
        .commit();

      setSaveStatus("saved");
      setDirty(false);
      setAnnouncements((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                titleJa: draftTitleJa,
                titleEn: draftTitleEn,
                date: draftDate,
                pinned: draftPinned,
              }
            : a,
        ),
      );
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function handleDelete(id: string) {
    try {
      await client.delete(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setExpandedId(null);
      setConfirmingDelete(null);
      setDirty(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function handleCreate() {
    if (!createTitleJa.trim()) return;
    setCreateStatus("saving");
    try {
      await client.create({
        _type: "announcement",
        date: createDate,
        pinned: createPinned,
        title: [
          { _key: "ja", value: createTitleJa },
          { _key: "en", value: createTitleEn },
        ],
      });
      setCreateStatus("saved");
      // Reset form
      setCreateTitleJa("");
      setCreateTitleEn("");
      setCreateDate(new Date().toISOString().slice(0, 10));
      setCreatePinned(false);
      // fetchAnnouncements will fire via the listener, but fetch eagerly too
      fetchAnnouncements();
      setTimeout(() => {
        setCreateStatus("idle");
        setCreating(false);
      }, 1500);
    } catch (err) {
      console.error("Create failed:", err);
      setCreateStatus("error");
      setTimeout(() => setCreateStatus("idle"), 3000);
    }
  }

  if (loading) {
    return (
      <Card padding={4} radius={2} border>
        <Text muted>読み込み中…</Text>
      </Card>
    );
  }

  return (
    <Stack space={3}>
      {/* Inline create */}
      {creating ? (
        <Card padding={4} radius={2} border tone="positive">
          <Stack space={4}>
            <Heading as="h3" size={0}>
              新しいお知らせ
            </Heading>
            <Stack space={2}>
              <Label size={0}>日付</Label>
              <input
                type="date"
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
                style={{
                  font: "inherit",
                  fontSize: "0.8125rem",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid var(--card-border-color)",
                  borderRadius: "3px",
                  background: "var(--card-bg-color)",
                  color: "inherit",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </Stack>
            <Stack space={2}>
              <Label size={0}>タイトル（日本語）</Label>
              <TextInput
                value={createTitleJa}
                onChange={(e) => setCreateTitleJa(e.currentTarget.value)}
                fontSize={1}
              />
            </Stack>
            <Stack space={2}>
              <Label size={0}>Title (English)</Label>
              <TextInput
                value={createTitleEn}
                onChange={(e) => setCreateTitleEn(e.currentTarget.value)}
                fontSize={1}
              />
            </Stack>
            <Flex align="center" gap={3}>
              <Switch
                checked={createPinned}
                onChange={() => setCreatePinned(!createPinned)}
              />
              <Label size={0}>固定表示</Label>
            </Flex>
            <Flex align="center" gap={2}>
              <Button
                text="作成"
                tone="positive"
                fontSize={1}
                padding={2}
                onClick={handleCreate}
                disabled={
                  createStatus === "saving" || !createTitleJa.trim()
                }
              />
              <Button
                text="キャンセル"
                mode="ghost"
                fontSize={1}
                padding={2}
                onClick={() => {
                  setCreating(false);
                  setCreateStatus("idle");
                }}
              />
              {createStatus === "saving" && (
                <Text size={1} muted>
                  作成中…
                </Text>
              )}
              {createStatus === "saved" && (
                <Inline space={1}>
                  <Text size={1} style={{ color: "green" }}>
                    <CheckmarkCircleIcon />
                  </Text>
                  <Text size={1} style={{ color: "green" }}>
                    作成しました
                  </Text>
                </Inline>
              )}
              {createStatus === "error" && (
                <Text size={1} style={{ color: "red" }}>
                  作成に失敗しました
                </Text>
              )}
            </Flex>
          </Stack>
        </Card>
      ) : (
        <Button
          icon={AddIcon}
          text="新しいお知らせを作成"
          mode="ghost"
          tone="positive"
          fontSize={1}
          padding={3}
          onClick={() => setCreating(true)}
        />
      )}

      {/* Announcement list */}
      {announcements.length === 0 && (
        <Card padding={4} radius={2} border>
          <Text muted>お知らせがまだありません。</Text>
        </Card>
      )}

      {announcements.map((a) => {
        const isExpanded = expandedId === a._id;

        return (
          <Card
            key={a._id}
            padding={3}
            radius={2}
            border
            tone={isExpanded ? "primary" : undefined}
          >
            {/* Collapsed row — always visible */}
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              onClick={() => expandCard(a)}
              style={{ cursor: "pointer" }}
            >
              <Flex align="center" gap={3} style={{ minWidth: 0 }}>
                <Text size={0} style={{ flexShrink: 0, opacity: a.pinned ? 1 : 0 }}>
                  <PinIcon />
                </Text>
                <Text size={0} style={{ flexShrink: 0 }}>
                  {a.date ?? "—"}
                </Text>
                <Text
                  size={1}
                  weight="medium"
                  textOverflow="ellipsis"
                  style={{ minWidth: 0 }}
                >
                  {a.titleJa ?? "（タイトルなし）"}
                </Text>
              </Flex>
              <Text size={0} muted style={{ flexShrink: 0 }}>
                {isExpanded ? "▲" : "▼"}
              </Text>
            </Flex>

            {/* Expanded editing fields */}
            {isExpanded && (
              <Box marginTop={4}>
                <Stack space={4}>
                  {/* Date */}
                  <Stack space={2}>
                    <Label size={0}>日付</Label>
                    <input
                      type="date"
                      value={draftDate}
                      onChange={(e) => {
                        setDraftDate(e.target.value);
                        markDirty();
                      }}
                      style={{
                        font: "inherit",
                        fontSize: "0.8125rem",
                        padding: "0.5rem 0.75rem",
                        border: "1px solid var(--card-border-color)",
                        borderRadius: "3px",
                        background: "var(--card-bg-color)",
                        color: "inherit",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </Stack>

                  {/* Title (Japanese) */}
                  <Stack space={2}>
                    <Label size={0}>タイトル（日本語）</Label>
                    <TextInput
                      value={draftTitleJa}
                      onChange={(e) => {
                        setDraftTitleJa(e.currentTarget.value);
                        markDirty();
                      }}
                      fontSize={1}
                    />
                  </Stack>

                  {/* Title (English) */}
                  <Stack space={2}>
                    <Label size={0}>Title (English)</Label>
                    <TextInput
                      value={draftTitleEn}
                      onChange={(e) => {
                        setDraftTitleEn(e.currentTarget.value);
                        markDirty();
                      }}
                      fontSize={1}
                    />
                  </Stack>

                  {/* Pinned toggle */}
                  <Flex align="center" gap={3}>
                    <Switch
                      checked={draftPinned}
                      onChange={() => {
                        setDraftPinned(!draftPinned);
                        markDirty();
                      }}
                    />
                    <Label size={0}>固定表示</Label>
                  </Flex>

                  {/* Actions */}
                  <Flex align="center" justify="space-between" gap={3}>
                    <Inline space={2}>
                      <Button
                        text="保存"
                        tone="positive"
                        fontSize={1}
                        padding={2}
                        onClick={() => handleSave(a._id)}
                        disabled={saveStatus === "saving"}
                      />
                      {saveStatus === "saving" && (
                        <Text size={1} muted>
                          保存中…
                        </Text>
                      )}
                      {saveStatus === "saved" && (
                        <Inline space={1}>
                          <Text size={1} style={{ color: "green" }}>
                            <CheckmarkCircleIcon />
                          </Text>
                          <Text size={1} style={{ color: "green" }}>
                            保存しました
                          </Text>
                        </Inline>
                      )}
                      {saveStatus === "error" && (
                        <Text size={1} style={{ color: "red" }}>
                          保存に失敗しました
                        </Text>
                      )}
                    </Inline>
                    <Inline space={2}>
                      <Button
                        icon={EditIcon}
                        text="詳細を編集"
                        mode="ghost"
                        tone="primary"
                        fontSize={1}
                        padding={2}
                        onClick={() =>
                          navigateStudio(
                            `structure/announcements;${a._id}`,
                          )
                        }
                      />
                      {confirmingDelete === a._id ? (
                        <Inline space={2}>
                          <Button
                            text="削除する"
                            tone="critical"
                            fontSize={1}
                            padding={2}
                            onClick={() => handleDelete(a._id)}
                          />
                          <Button
                            text="キャンセル"
                            mode="ghost"
                            fontSize={1}
                            padding={2}
                            onClick={() => setConfirmingDelete(null)}
                          />
                        </Inline>
                      ) : (
                        <Button
                          icon={TrashIcon}
                          mode="ghost"
                          tone="critical"
                          fontSize={1}
                          padding={2}
                          onClick={() => setConfirmingDelete(a._id)}
                        />
                      )}
                    </Inline>
                  </Flex>
                </Stack>
              </Box>
            )}
          </Card>
        );
      })}
    </Stack>
  );
}

// ── Event flyer preview ──────────────────────────────────

interface SanityImageRef {
  asset?: { _ref: string };
}

interface FlyerData {
  image?: SanityImageRef;
  imageJa?: SanityImageRef;
  imageEn?: SanityImageRef;
  alt?: Array<{ _key: string; value: string }>;
}

const FLYER_QUERY = `*[_type == "homepage"][0].eventFlyers[]{
  image,
  imageJa,
  imageEn,
  alt
}`;

function EventFlyerPreview() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [flyers, setFlyers] = useState<FlyerData[] | null>(null);
  const [loading, setLoading] = useState(true);

  const builder = createImageUrlBuilder(client);

  function imgUrl(ref: SanityImageRef) {
    return builder.image(ref).height(240).auto("format").url();
  }

  useEffect(() => {
    client
      .fetch<FlyerData[] | null>(FLYER_QUERY)
      .then(setFlyers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client]);

  // Build thumbnail list mirroring EventFlyerPairWrapper logic
  const thumbnails: { src: string; label: string }[] = [];
  if (flyers) {
    for (const f of flyers) {
      if (f.imageJa?.asset && f.imageEn?.asset) {
        thumbnails.push({ src: imgUrl(f.imageJa), label: "日本語版" });
        thumbnails.push({ src: imgUrl(f.imageEn), label: "English" });
      } else {
        const img = f.image || f.imageJa;
        if (img?.asset) {
          const altJa = f.alt?.find((a) => a._key === "ja")?.value;
          thumbnails.push({ src: imgUrl(img), label: altJa || "チラシ" });
        }
      }
    }
  }

  return (
    <Card padding={4} radius={2} border>
      <Stack space={4}>
        <Flex align="center" gap={2}>
          <Text size={2}>
            <ImageIcon />
          </Text>
          <Heading as="h2" size={1}>
            イベントチラシ
          </Heading>
        </Flex>

        {loading ? (
          <Text size={1} muted>
            読み込み中…
          </Text>
        ) : thumbnails.length === 0 ? (
          <Text size={1} muted>
            イベントチラシがありません
          </Text>
        ) : (
          <Flex gap={3} wrap="wrap">
            {thumbnails.map((t, i) => (
              <Stack key={i} space={2}>
                <img
                  src={t.src}
                  alt={t.label}
                  style={{
                    height: 120,
                    width: "auto",
                    borderRadius: 4,
                    border: "1px solid var(--card-border-color)",
                  }}
                />
                <Text size={0} muted align="center">
                  {t.label}
                </Text>
              </Stack>
            ))}
          </Flex>
        )}

        <Button
          icon={EditIcon}
          text="イベントチラシを編集"
          mode="ghost"
          tone="primary"
          fontSize={1}
          padding={2}
          onClick={() => navigateStudio("structure/homepage")}
        />
      </Stack>
    </Card>
  );
}

// ── Dashboard component ───────────────────────────────────

function DashboardComponent() {
  return (
    <Box padding={5} sizing="border" style={{ maxWidth: 860, margin: "0 auto" }}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading as="h1" size={3}>
            横須賀国際交流協会 管理画面
          </Heading>
          <Text size={2} muted>
            よく使う操作をここから始められます。
          </Text>
        </Stack>

        <EventFlyerPreview />

        <Stack space={3}>
          <Heading as="h2" size={1}>
            お知らせ
          </Heading>
          <RecentAnnouncements />
        </Stack>
      </Stack>
    </Box>
  );
}

// ── Plugin definition ─────────────────────────────────────

const dashboardTool: Tool = {
  name: "dashboard",
  title: "ダッシュボード",
  component: DashboardComponent,
};

export const dashboardPlugin = definePlugin({
  name: "yia-dashboard",
  tools: [dashboardTool],
});
