import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Dibujo de polígonos sin DrawingManager (removido en Maps JS API 3.65).
 * Clic para agregar vértices; doble clic o botón "Finalizar" para cerrar.
 */
export function useMapPolygonDrawing({ mapRef, active, polygonStyle, onComplete }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const previewLineRef = useRef(null);
  const previewMarkersRef = useRef([]);
  const onCompleteRef = useRef(onComplete);
  const polygonStyleRef = useRef(polygonStyle);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    polygonStyleRef.current = polygonStyle;
  }, [onComplete, polygonStyle]);

  const cleanupPreview = useCallback(() => {
    if (previewLineRef.current) {
      previewLineRef.current.setMap(null);
      previewLineRef.current = null;
    }
    for (const marker of previewMarkersRef.current) {
      marker.setMap(null);
    }
    previewMarkersRef.current = [];
  }, []);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setDraftPoints([]);
    cleanupPreview();
  }, [cleanupPreview]);

  const startDrawing = useCallback(() => {
    cancelDrawing();
    setIsDrawing(true);
  }, [cancelDrawing]);

  const finishDrawing = useCallback(
    (points) => {
      const map = mapRef.current;
      if (!map || !window.google?.maps || points.length < 3) return false;

      const paths = points.map(({ lat, lng }) => ({ lat, lng }));
      const poly = new window.google.maps.Polygon({
        paths,
        ...polygonStyleRef.current,
        map,
      });

      setIsDrawing(false);
      setDraftPoints([]);
      cleanupPreview();
      onCompleteRef.current?.(poly);
      return true;
    },
    [mapRef, cleanupPreview],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps || !isDrawing || !active) {
      cleanupPreview();
      return;
    }

    cleanupPreview();

    if (draftPoints.length === 0) return;

    const style = polygonStyleRef.current ?? {};

    for (let i = 0; i < draftPoints.length; i += 1) {
      const pt = draftPoints[i];
      const marker = new window.google.maps.Marker({
        position: pt,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: i === 0 ? 7 : 5,
          fillColor: style.strokeColor || "#008f5a",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        zIndex: 10,
      });
      if (i === 0) {
        marker.addListener("click", () => {
          setDraftPoints((current) => {
            if (current.length >= 3) finishDrawing(current);
            return current;
          });
        });
      }
      previewMarkersRef.current.push(marker);
    }

    if (draftPoints.length >= 2) {
      previewLineRef.current = new window.google.maps.Polyline({
        path: draftPoints,
        strokeColor: style.strokeColor || "#008f5a",
        strokeWeight: 2,
        map,
      });
    }
  }, [draftPoints, isDrawing, active, mapRef, cleanupPreview, finishDrawing]);

  useEffect(() => {
    if (!active) cancelDrawing();
  }, [active, cancelDrawing]);

  const handleMapClick = useCallback(
    (e) => {
      if (!isDrawing || !active) return false;
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return false;
      setDraftPoints((prev) => [...prev, { lat, lng }]);
      return true;
    },
    [isDrawing, active],
  );

  const handleMapDblClick = useCallback(
    (e) => {
      if (!isDrawing || !active) return false;
      if (typeof e?.stop === "function") e.stop();
      if (draftPoints.length >= 3) finishDrawing(draftPoints);
      return true;
    },
    [isDrawing, active, draftPoints, finishDrawing],
  );

  const confirmDrawing = useCallback(() => finishDrawing(draftPoints), [draftPoints, finishDrawing]);

  return {
    isDrawing,
    draftPointCount: draftPoints.length,
    startDrawing,
    cancelDrawing,
    confirmDrawing,
    handleMapClick,
    handleMapDblClick,
  };
}
