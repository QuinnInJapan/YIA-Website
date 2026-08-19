"use client";

// Sanity marks NavbarProps as an internal type, so this adapter stays structural at the boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function YiaStudioNavbar(props: any) {
  return (
    <>
      {props.renderDefault(props)}
      <style>{`
        [data-testid="studio-navbar"] button[aria-label="新しいドキュメントを作成"],
        [data-testid="studio-navbar"] button[aria-label="検索を開く"],
        [data-testid="studio-navbar"] button[aria-label="Create new document"],
        [data-testid="studio-navbar"] button[aria-label="Open search"] {
          display: none !important;
        }
      `}</style>
    </>
  );
}
