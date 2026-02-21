// This file is ai-generated and not checked by a human.

import { useEffect, useState } from "react";
import { IDwitlitDB } from "@dwitlit-db/data";

/**
 * Type for visualized data node
 */
interface VisualizedNode {
  internalId: number;
  dwitlitId: string;
  links: Array<[string, number | null]>;
  data: string;
  confirmed: boolean;
}

/**
 * Props for the visualizer
 */
interface Props {
  database: IDwitlitDB;
}

/**
 * Visualizer component for DwitlitDB
 */
export function DwitlitDBVisualizer({ database }: Props) {
  const [nodes, setNodes] = useState<VisualizedNode[]>([]);

  // Form state for adding new nodes
  const [newId, setNewId] = useState("");
  const [newData, setNewData] = useState("");
  const [newLinks, setNewLinks] = useState("");
  const [newConfirmed, setNewConfirmed] = useState(false);

  /**
   * Load all nodes from database
   */
  const loadNodes = () => {
    const result: VisualizedNode[] = [];

    const iterator = database.iterateDataNodes();

    for (const internalId of iterator) {
      if (internalId === null) break;

      const node = database.getDataNode(internalId);
      if (!node) continue;

      const [dwitlitId, links, data, confirmed] = node;

      // Convert bytes to readable string if possible
      let dataString: string;

      try {
        dataString = new TextDecoder().decode(data);
      } catch {
        dataString = btoa(
          String.fromCharCode(...Array.from(data as Uint8Array))
        );
      }

      result.push({
        internalId,
        dwitlitId,
        links,
        data: dataString,
        confirmed,
      });
    }

    setNodes(result);
  };

  /**
   * Setup database listener
   */
  useEffect(() => {
    loadNodes();

    const listener = () => {
      loadNodes();
    };

    database.addDatabaseChangeListener(listener);

    return () => {
      database.removeDatabaseChangeListener(listener);
    };
  }, [database]);

  /**
   * Parse links from input
   * Format: id1:null,id2:5,id3:null
   */
  const parseLinks = (): Array<[string, number | null]> => {
    if (!newLinks.trim()) return [];

    return newLinks.split(",").map((entry) => {
      const [id, target] = entry.split(":");

      return [
        id.trim(),
        target === "null" || !target ? null : Number(target),
      ];
    });
  };

  /**
   * Add new data node
   */
  const handleAdd = () => {
    if (!newId.trim()) return;

    const links = parseLinks();

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(newData);

    database.setDataNode(
      newId,
      links,
      dataBytes,
      newConfirmed
    );

    // Reset form
    setNewId("");
    setNewData("");
    setNewLinks("");
    setNewConfirmed(false);
  };

  /**
   * Remove node
   */
  const handleDelete = (id: number) => {
    database.removeDataNode(id);
  };

  /**
   * Toggle confirmation flag
   */
  const toggleConfirm = (id: number, value: boolean) => {
    database.updateConfirmationFlag(id, value);
  };

  return (
    <div className="card">
      <h2>DwitlitDB Visualizer</h2>

      {/* Add Node Form */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Dwitlit ID"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />

        <input
          type="text"
          placeholder="Data"
          value={newData}
          onChange={(e) => setNewData(e.target.value)}
        />

        <input
          type="text"
          placeholder="Links (id:null,id2:5)"
          value={newLinks}
          onChange={(e) => setNewLinks(e.target.value)}
        />

        <label style={{ marginLeft: "0.5rem" }}>
          <input
            type="checkbox"
            checked={newConfirmed}
            onChange={(e) => setNewConfirmed(e.target.checked)}
          />
          Confirmed
        </label>

        <button onClick={handleAdd}>
          Add Node
        </button>
      </div>

      {/* Nodes Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>Internal ID</th>
            <th>Dwitlit ID</th>
            <th>Links</th>
            <th>Data</th>
            <th>Confirmed</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {nodes.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                No data
              </td>
            </tr>
          ) : (
            nodes.map((node) => (
              <tr key={node.internalId}>
                <td>{node.internalId}</td>

                <td>{node.dwitlitId}</td>

                <td>
                  {node.links.length === 0
                    ? "-"
                    : node.links.map(([id, target], i) => (
                        <div key={i}>
                          {id} →{" "}
                          {target === null
                            ? "null"
                            : target}
                        </div>
                      ))}
                </td>

                <td>{node.data}</td>

                <td>
                  <input
                    type="checkbox"
                    checked={node.confirmed}
                    onChange={(e) =>
                      toggleConfirm(
                        node.internalId,
                        e.target.checked
                      )
                    }
                  />
                </td>

                <td>
                  <button
                    onClick={() =>
                      handleDelete(node.internalId)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}