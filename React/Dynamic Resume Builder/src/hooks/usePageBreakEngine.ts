import { useState, useEffect, useCallback, RefObject } from 'react';
import { ResumeSection } from '../types/resume';

export interface PageBreakStatus {
  page1Height: number;
  a4LimitPx: number; // 1123px
  overflowPx: number;
  isContentSafe: boolean;
  splitSectionIndex: number | null;
  sectionHeights: Record<string, number>;
  pageGapMargin: number;
  totalPages: number;
}

export const A4_PAGE_HEIGHT_PX = 1123; // 297mm at 96 DPI
export const A4_PAGE_WIDTH_PX = 794;  // 210mm at 96 DPI

export function usePageBreakEngine(
  containerRef: RefObject<HTMLElement>,
  sections: ResumeSection[],
  dependencies: any[] = []
): PageBreakStatus {
  const [status, setStatus] = useState<PageBreakStatus>({
    page1Height: 0,
    a4LimitPx: A4_PAGE_HEIGHT_PX,
    overflowPx: 0,
    isContentSafe: true,
    splitSectionIndex: null,
    sectionHeights: {},
    pageGapMargin: 0,
    totalPages: 1,
  });

  const measureLayout = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    // Find header and all section elements tagged with data-section-id
    const headerEl = container.querySelector('[data-resume-header]') as HTMLElement | null;
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;

    let cumulativeHeight = headerHeight;
    const heights: Record<string, number> = {};
    let splitIndex: number | null = null;
    let prevCumulative = headerHeight;
    let gapMargin = 0;

    const visibleSections = sections.filter((s) => s.isVisible);

    visibleSections.forEach((sec, idx) => {
      const el = container.querySelector(`[data-section-node="${sec.id}"]`) as HTMLElement | null;
      const h = el ? el.offsetHeight : 0;
      heights[sec.id] = h;

      const nextHeight = cumulativeHeight + h;
      if (nextHeight > A4_PAGE_HEIGHT_PX && splitIndex === null) {
        splitIndex = idx;
        // Inject virtual gap to push next section smoothly to Page 2
        gapMargin = Math.max(0, A4_PAGE_HEIGHT_PX - prevCumulative) + 32;
      }

      prevCumulative = cumulativeHeight;
      cumulativeHeight = nextHeight;
    });

    const overflowPx = Math.max(0, cumulativeHeight - A4_PAGE_HEIGHT_PX);
    const totalPages = Math.max(1, Math.ceil(cumulativeHeight / A4_PAGE_HEIGHT_PX));

    setStatus({
      page1Height: Math.min(cumulativeHeight, A4_PAGE_HEIGHT_PX),
      a4LimitPx: A4_PAGE_HEIGHT_PX,
      overflowPx,
      isContentSafe: overflowPx === 0,
      splitSectionIndex: splitIndex,
      sectionHeights: heights,
      pageGapMargin: gapMargin,
      totalPages,
    });
  }, [containerRef, sections]);

  useEffect(() => {
    measureLayout();

    // ResizeObserver for offscreen / real-time container mutations
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      measureLayout();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [measureLayout, ...dependencies]);

  return status;
}
