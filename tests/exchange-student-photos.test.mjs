import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  DEFAULT_ATTACHMENTS_DIR,
  DISPATCH_GALLERY_KEY,
  EXCHANGE_STUDENT_PHOTOS,
  attachmentPlan,
  replaceExchangeStudentGallery,
} from "../scripts/lib/exchange-student-photos.mjs";

test("attachmentPlan keeps the exchange-student photos in the intended attachment order", () => {
  const planned = attachmentPlan("/tmp/attachments");

  assert.deepEqual(
    planned.map((item) => item.filename),
    EXCHANGE_STUDENT_PHOTOS.map((item) => item.filename),
  );
  assert.equal(
    planned[0].path,
    path.join("/tmp/attachments", "第2回研修　写真の撮り方.jpg"),
  );
  assert.equal(
    attachmentPlan()[0].path,
    path.join(DEFAULT_ATTACHMENTS_DIR, "第2回研修　写真の撮り方.jpg"),
  );
});

test("replaceExchangeStudentGallery replaces only the dispatch gallery with uploaded image refs", () => {
  const intro = { _key: "intro", _type: "content" };
  const hostGallery = {
    _key: "44a174c7-a62",
    _type: "gallery",
    images: [{ _key: "host-family-photo" }],
  };
  const sections = [
    intro,
    {
      _key: DISPATCH_GALLERY_KEY,
      _type: "gallery",
      images: [{ _key: "old-dispatch-photo" }],
    },
    hostGallery,
  ];
  const assetsByFilename = Object.fromEntries(
    EXCHANGE_STUDENT_PHOTOS.map((photo, index) => [
      photo.filename,
      { _id: `image-exchange-${index + 1}` },
    ]),
  );

  const result = replaceExchangeStudentGallery(sections, assetsByFilename);

  assert.equal(result.sections[0], intro);
  assert.equal(result.sections[2], hostGallery);
  assert.notEqual(result.sections[1], sections[1]);
  assert.equal(result.images.length, 6);
  assert.deepEqual(
    result.images.map((image) => image.file.asset._ref),
    [
      "image-exchange-1",
      "image-exchange-2",
      "image-exchange-3",
      "image-exchange-4",
      "image-exchange-5",
      "image-exchange-6",
    ],
  );
  assert.deepEqual(result.images[0].caption, [
    { _key: "ja", value: "第2回研修：写真の撮り方" },
    { _key: "en", value: "Training Session 2: Photography" },
  ]);
  assert.deepEqual(result.images[5].caption, [
    { _key: "ja", value: "第4回研修：英会話" },
    { _key: "en", value: "Training Session 4: English Conversation" },
  ]);
});

test("replaceExchangeStudentGallery fails loudly when the dispatch gallery is missing", () => {
  assert.throws(
    () => replaceExchangeStudentGallery([{ _key: "other", _type: "gallery" }], {}),
    /Exchange-student gallery section was not found/,
  );
});
