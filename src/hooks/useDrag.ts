import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "./use-mobile";

const useDrag = () => {
    const parentRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });
    const isMobile= useIsMobile();

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMobile) return;
        setIsDragging(true);
        const rect = boxRef.current?.getBoundingClientRect();
        offset.current = {
            x: e.clientX - (rect?.left || 0),
            y: e.clientY - (rect?.top || 0),
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !parentRef.current || !boxRef.current) return;

        const parentRect = parentRef.current.getBoundingClientRect();
        const boxRect = boxRef.current.getBoundingClientRect();

        const newX = e.clientX - parentRect.left - offset.current.x;
        const newY = e.clientY - parentRect.top - offset.current.y;

        const maxX = parentRect.width - boxRect.width;
        const maxY = parentRect.height - boxRect.height;

        boxRef.current.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        boxRef.current.style.top = `${Math.max(0, Math.min(newY, maxY))}px`
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Attach/remove event listeners globally
    useEffect(() => {
        if (isMobile) return;
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return {parentRef, boxRef, handleMouseDown}
}

export default useDrag;