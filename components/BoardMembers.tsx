import type { BoardMember } from "@/lib/types";

interface BoardMembersProps {
  board: {
    asOf?: string;
    members: BoardMember[];
  };
}

export default function BoardMembers({ board }: BoardMembersProps) {
  return (
    <>
      {board.asOf && <p className="section-note">{board.asOf}</p>}
      <div className="board-grid">
        {(board.members || []).map((m, i) => (
          <div className="board-member" key={i}>
            <div className="board-member__role">
              {m.roleJa} {m.roleEn}
            </div>
            <div>{m.name}</div>
          </div>
        ))}
      </div>
    </>
  );
}
