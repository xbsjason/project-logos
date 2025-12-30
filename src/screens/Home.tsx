import React from 'react';
import { debugClearPwaCache } from '../core/utils/pwaDebug';

export const Home: React.FC = () => {
    // REMOVED: All state and resize listeners to prevent WebKit crashes.

    return (
        <div style={{ paddingBottom: '20px' }}>
            {/* Header Area */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #eee',
                background: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>FaithVoice</h1>
            </div>

            <div style={{ padding: '20px' }}>
                <p>Welcome back.</p>

                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{
                        padding: '16px',
                        margin: '10px 0',
                        background: '#f5f5f7',
                        borderRadius: '12px'
                    }}>
                        <strong>Card {i + 1}</strong>
                        <p style={{ margin: '4px 0 0', color: '#666' }}>
                            This is a feed item to test scrolling.
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #eee', marginTop: '20px' }}>
                <h3>Debug Tools</h3>
                <button
                    onClick={debugClearPwaCache}
                    style={{ padding: '10px', background: 'red', color: 'white' }}
                >
                    Reset PWA & Cache
                </button>
            </div>
        </div>
    );
};
