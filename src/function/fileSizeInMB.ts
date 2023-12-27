import fs from 'fs';

export async function getRarFileSizeInMB(filePath: string) {
    try {
        const stats = await fs.promises.stat(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024); // Convert bytes to megabytes
        return parseFloat(fileSizeInMB.toFixed(2)); // Round to two decimal places
    } catch (error) {
        console.error(`Error getting file size: ${error.message}`);
        return 0;
    }
}

export function formatBytes(bytes: number, decimals: number = 2) {
    if (bytes === 0) return '0 Bytes';

    // if (bytes === 0) return 0;
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}