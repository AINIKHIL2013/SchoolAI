
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const getFileMimeType = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        resolve(file.type || 'application/octet-stream');
    });
};
