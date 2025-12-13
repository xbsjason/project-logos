import { useState, useRef, useEffect } from 'react';
import { FeedPost } from './FeedPost';
import type { Post } from '../../data/mockData';

interface FeedContainerProps {
    posts: Post[];
}

export function FeedContainer({ posts }: FeedContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Intersection Observer to track active post
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        setActiveIndex(index);
                    }
                });
            },
            {
                root: container,
                threshold: 0.6, // 60% visibility required to be "active"
            }
        );

        const elements = container.querySelectorAll('[data-index]');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [posts]);

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll scrollbar-hide bg-background pb-20 pt-20 transition-colors duration-300"
        >
            {posts.map((post, index) => (
                <div key={post.id} data-index={index} className="w-full mb-6">
                    <FeedPost
                        post={post}
                        isActive={index === activeIndex}
                    />
                </div>
            ))}
        </div>
    );
}
