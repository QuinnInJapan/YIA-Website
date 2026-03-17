import { useState } from "react";
import { useClient, useDocumentOperation } from "sanity";
import type { DocumentActionComponent } from "sanity";

/**
 * Custom delete action for blogPost documents.
 * Before deleting, removes the post's reference from all other posts' relatedPosts arrays.
 */
export const cleanDeleteAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: "2024-01-01" });
  const { delete: deleteOp } = useDocumentOperation(props.id, props.type);
  const [isDeleting, setIsDeleting] = useState(false);

  return {
    label: "削除",
    tone: "critical" as const,
    disabled: isDeleting,
    onHandle: async () => {
      setIsDeleting(true);
      try {
        // Remove this post from all other posts' relatedPosts arrays
        const referring = await client.fetch<string[]>(
          `*[_type == "blogPost" && references($id)]._id`,
          { id: props.id },
        );
        if (referring.length > 0) {
          const tx = client.transaction();
          for (const refId of referring) {
            tx.patch(refId, (p) => p.unset([`relatedPosts[_ref=="${props.id}"]`]));
          }
          await tx.commit();
        }

        deleteOp.execute();
      } finally {
        setIsDeleting(false);
        props.onComplete();
      }
    },
  };
};
