/**
 * Utility functions for image processing
 */

/**
 * Compresses an image file to a maximum dimension and quality.
 * Converts to JPEG format.
 * 
 * @param file The original image file
 * @param maxWidth The maximum width/height (default 1920px)
 * @param quality The JPEG quality (0 to 1, default 0.8)
 * @returns Promise resolving to the compressed File
 */
export async function compressImage(
    file: File,
    maxWidth = 1920,
    quality = 0.8
): Promise<File> {
    return new Promise((resolve, reject) => {
        // 1. Create an image element
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.src = url;

        img.onload = () => {
            // 2. Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round(width * (maxWidth / height));
                    height = maxWidth;
                }
            }

            // 3. Create canvas and draw
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Use better interpolation if available (browser dependent, but good practice)
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, width, height);

            // 4. Convert to Blob/File
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);

                    if (!blob) {
                        reject(new Error('Canvas to Blob conversion failed'));
                        return;
                    }

                    // Create a new File object
                    // Note: We force .jpg extension as we're converting to JPEG
                    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    const newFile = new File([blob], newFileName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    console.log(`[ImageUtils] Compressed ${file.size} -> ${newFile.size} bytes`);
                    resolve(newFile);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
    });
}
