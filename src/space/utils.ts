
export function getPathFileName(path: string): string {
    return path ? path.split('/').pop() || '' : '';
}