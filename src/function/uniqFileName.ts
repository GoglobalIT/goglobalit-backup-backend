import path from 'path'

export function uniqFileName(file: Express.Multer.File) {
    // Get the file extension
    const fileExtension = path.extname(file.originalname);

    // Get the filename without extension
    const filenameWithoutExtension = path.parse(file.originalname).name;

    return `${filenameWithoutExtension}_${Date.now()}${fileExtension}`;
}
export function uniqFileNameRar(inputFileName: string) {
    const matchResult = inputFileName.match(/^(.+)_([\d-]+_at_[\d_]+)\.(.+)$/);

    if (matchResult) {
        const fileName = matchResult[1]; // Extracted file name
        const extension = matchResult[2]; // Extracted file extension

        // Generate a new filename using the extracted parts and current date
        return `${fileName}_${Date.now()}.${extension}`;


    } else {
        return `${Date.now()}_`
    }
}
