import { useTheme } from '../../contexts/ThemeContext';

export function ThemeDebugPage() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-background text-primary p-8 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-serif">Theme System Debug</h1>
                    <button
                        onClick={toggleTheme}
                        className="px-4 py-2 bg-surface border border-accent rounded-lg shadow-sm hover:bg-surface-highlight transition-colors"
                    >
                        Toggle Theme ({theme})
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Backgrounds Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 border-b border-default pb-2">Backgrounds</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded border border-default bg-background">
                                <span className="text-sm font-mono">bg-background</span>
                                <p className="text-sm mt-1 opacity-70">Main Application Background</p>
                            </div>
                            <div className="p-4 rounded border border-default bg-surface shadow-sm">
                                <span className="text-sm font-mono">bg-surface</span>
                                <p className="text-sm mt-1 opacity-70">Card / Modal Background</p>
                            </div>
                            <div className="p-4 rounded border border-default bg-surface-highlight">
                                <span className="text-sm font-mono">bg-surface-highlight</span>
                                <p className="text-sm mt-1 opacity-70">Inputs / Hover States</p>
                            </div>
                        </div>
                    </section>

                    {/* Text Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 border-b border-default pb-2">Typography & Content</h2>
                        <div className="bg-surface p-6 rounded-lg border border-default space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-primary">Heading 1 (text-primary)</h3>
                                <p className="text-primary mt-1">This is standard body text using the primary text color.</p>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-secondary">Subtitle (text-secondary)</h4>
                                <p className="text-secondary mt-1">Secondary text used for metadata, captions, or less emphasized content.</p>
                            </div>
                            <div>
                                <span className="text-accent font-bold">Accent Text (text-accent)</span>
                                <p className="text-sm text-primary mt-1">Used for links: <a href="#" className="underline text-accent">Click me</a></p>
                            </div>
                        </div>
                    </section>

                    {/* Interactive Elements */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 border-b border-default pb-2">Interactive</h2>
                        <div className="flex gap-4">
                            <button className="px-4 py-2 bg-primary text-inverse rounded-lg">
                                Primary Button
                            </button>
                            <button className="px-4 py-2 bg-surface border border-default text-primary rounded-lg hover:border-accent hover:text-accent transition-colors">
                                Secondary Button
                            </button>
                            <input
                                type="text"
                                placeholder="Input field..."
                                className="px-4 py-2 bg-surface-highlight rounded-lg border border-default focus:border-highlight outline-none"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
