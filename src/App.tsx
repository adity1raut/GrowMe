import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 12,
    offset: 0,
    total_pages: 0,
    current_page: 1,
  });

  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [rowCountInput, setRowCountInput] = useState<string>("");
  const overlayPanelRef = React.useRef<OverlayPanel>(null);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data = await response.json();

      setArtworks(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(1);
  }, []);

  const handlePageChange = (event: {
    first: number;
    rows: number;
    page: number;
    pageCount: number;
  }) => {
    const page = event.page + 1;
    fetchArtworks(page);
  };

  const handleSelectionChange = (e: {
    originalEvent?: React.SyntheticEvent;
    value: Artwork[];
  }) => {
    const updatedSelectedIds = new Set(selectedRowIds);

    if (Array.isArray(e.value)) {
      const currentPageRowIds = artworks.map((artwork) => artwork.id);

      currentPageRowIds.forEach((id) => updatedSelectedIds.delete(id));

      e.value.forEach((artwork: Artwork) => {
        updatedSelectedIds.add(artwork.id);
      });
    }

    setSelectedRowIds(updatedSelectedIds);
  };

  const getCurrentPageSelectedRows = (): Artwork[] => {
    return artworks.filter((artwork) => selectedRowIds.has(artwork.id));
  };

  const handleSelectRowsByCount = async () => {
    const count = parseInt(rowCountInput);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number");
      return;
    }

    const updatedSelectedIds = new Set(selectedRowIds);
    let rowsToSelect = count;
    let currentPage = 1;

    while (rowsToSelect > 0 && currentPage <= pagination.total_pages) {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${currentPage}`
      );
      const data = await response.json();

      for (const artwork of data.data) {
        if (rowsToSelect === 0) break;
        updatedSelectedIds.add(artwork.id);
        rowsToSelect--;
      }

      currentPage++;
    }

    setSelectedRowIds(updatedSelectedIds);
    overlayPanelRef.current?.hide();
    setRowCountInput("");
  };

  const totalSelectedCount = selectedRowIds.size;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <h1
        style={{ marginBottom: "1rem", fontSize: "2rem", fontWeight: "bold" }}
      >
        Art Institute of Chicago - Artworks
      </h1>

      {totalSelectedCount > 0 && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: "500" }}>
            {totalSelectedCount} row{totalSelectedCount !== 1 ? "s" : ""}{" "}
            selected
          </span>
        </div>
      )}

      <OverlayPanel ref={overlayPanelRef}>
        <div style={{ padding: "1rem", minWidth: "280px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="rowCount"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Select rows:
            </label>
            <InputText
              id="rowCount"
              value={rowCountInput}
              onChange={(e) => setRowCountInput(e.target.value)}
              placeholder="Enter number of rows"
              style={{ width: "100%", padding: "0.5rem" }}
              type="number"
            />
          </div>
          <Button
            label="Submit"
            onClick={handleSelectRowsByCount}
            style={{ width: "100%" }}
            size="small"
          />
        </div>
      </OverlayPanel>

      <DataTable
        value={artworks}
        loading={loading}
        selection={getCurrentPageSelectedRows()}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
        selectionMode="multiple"
        tableStyle={{ minWidth: "50rem" }}
        stripedRows
      >
        <Column
          selectionMode="multiple"
          header={() => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                paddingRight: "0.5rem",
              }}
            >
              <span />
              <i
                className="pi pi-chevron-down"
                style={{
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#6c757d",
                }}
                onClick={(e: React.MouseEvent<HTMLElement>) =>
                  overlayPanelRef.current?.toggle(e)
                }
                aria-hidden={false}
                role="button"
              />
            </div>
          )}
        />

        <Column
          field="title"
          header="Title"
          body={(rowData) => rowData.title || "N/A"}
          style={{ maxWidth: "300px" }}
        />
        <Column
          field="place_of_origin"
          header="Place of Origin"
          body={(rowData) => rowData.place_of_origin || "N/A"}
        />
        <Column
          field="artist_display"
          header="Artist"
          body={(rowData) => rowData.artist_display || "N/A"}
          style={{ maxWidth: "250px" }}
        />
        <Column
          field="inscriptions"
          header="Inscriptions"
          body={(rowData) => rowData.inscriptions || "N/A"}
          style={{ maxWidth: "200px" }}
        />
        <Column
          field="date_start"
          header="Date Start"
          body={(rowData) => rowData.date_start || "N/A"}
        />
        <Column
          field="date_end"
          header="Date End"
          body={(rowData) => rowData.date_end || "N/A"}
        />
      </DataTable>

      <Paginator
        first={pagination.offset}
        rows={pagination.limit}
        totalRecords={pagination.total}
        onPageChange={handlePageChange}
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        style={{ marginTop: "1rem" }}
      />
    </div>
  );
};

export default App;
