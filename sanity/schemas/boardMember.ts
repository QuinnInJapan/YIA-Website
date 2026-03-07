import { defineType, defineField } from "sanity";

export default defineType({
  name: "boardMember",
  title: "役員",
  type: "object",
  description: "役員名簿の1名分の情報。",
  preview: {
    select: { name: "name", role: "role" },
    prepare: ({ name, role }: { name?: string; role?: { _key: string; value: string }[] }) => ({
      title: name || "",
      subtitle: role?.find((r) => r._key === "ja")?.value || "",
    }),
  },
  fields: [
    defineField({
      name: "name",
      title: "名前",
      type: "string",
      description: "役員の氏名。",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "役職",
      type: "internationalizedArrayString",
      description: "役職名（例：理事長、副理事長、理事）。",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
