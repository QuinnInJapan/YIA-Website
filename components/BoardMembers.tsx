import type { BoardMember } from "@/lib/types";
import { ja, en } from "@/lib/i18n";
import { formatDateJa } from "@/lib/date-format";

interface BoardMembersProps {
  board: {
    asOf?: string;
    members: BoardMember[];
  };
}

export default function BoardMembers({ board }: BoardMembersProps) {
  return (
    <>
      {board.asOf && (
        <p className="section-note">
          {/^\d{4}-\d{2}-\d{2}$/.test(board.asOf)
            ? `${formatDateJa(board.asOf)}現在`
            : board.asOf}
        </p>
      )}
      <div className="board-grid">
        {(board.members || []).map((m, i) => (
          <div className="board-member" key={i}>
            <div className="board-member__role">
              {ja(m.role)} {en(m.role)}
            </div>
            <div>{m.name}</div>
          </div>
        ))}
      </div>
    </>
  );
}
