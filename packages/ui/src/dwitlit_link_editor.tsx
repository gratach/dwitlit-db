// This file is ai-generated and not checked by a human.

interface LinkEditorProps {
  links: Array<[string, number | null]>;
  onChange: (links: Array<[string, number | null]>) => void;
  onClose: () => void;
}

/**
 * Modal editor for link lists
 */
export function LinkEditor({
  links,
  onChange,
  onClose,
}: LinkEditorProps) {
  /**
   * Update one link
   */
  const updateLink = (
    index: number,
    id: string,
    target: string
  ) => {
    const copy = [...links];

    copy[index] = [
      id,
      target.trim() === ""
        ? null
        : Number(target),
    ];

    onChange(copy);
  };

  /**
   * Add new empty link
   */
  const addLink = () => {
    onChange([...links, ["", null]]);
  };

  /**
   * Remove link
   */
  const removeLink = (index: number) => {
    const copy = [...links];
    copy.splice(index, 1);
    onChange(copy);
  };

  /**
   * Move link up/down
   */
  const moveLink = (from: number, to: number) => {
    if (to < 0 || to >= links.length) return;

    const copy = [...links];
    const temp = copy[from];

    copy[from] = copy[to];
    copy[to] = temp;

    onChange(copy);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "1rem",
          width: "600px",
          borderRadius: "6px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <h3>Edit Links</h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Dwitlit ID</th>
              <th>Internal ID (empty = null)</th>
              <th>Order</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {links.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No links
                </td>
              </tr>
            )}

            {links.map(([id, target], i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) =>
                      updateLink(
                        i,
                        e.target.value,
                        target?.toString() ?? ""
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    placeholder="null"
                    value={target ?? ""}
                    onChange={(e) =>
                      updateLink(
                        i,
                        id,
                        e.target.value
                      )
                    }
                  />
                </td>

                <td>
                  <button
                    onClick={() =>
                      moveLink(i, i - 1)
                    }
                  >
                    ↑
                  </button>

                  <button
                    onClick={() =>
                      moveLink(i, i + 1)
                    }
                  >
                    ↓
                  </button>
                </td>

                <td>
                  <button
                    onClick={() => removeLink(i)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "1rem" }}>
          <button onClick={addLink}>
            + Add Link
          </button>

          <button
            style={{ marginLeft: "1rem" }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}