
/**
 * Helper function to read a File as ArrayBuffer using FileReader API
 * This is more Safari-compatible than using file.arrayBuffer()
 */
export const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};
