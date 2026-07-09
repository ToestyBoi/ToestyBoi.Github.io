export function getTitleWithFilename(chartName: string, fileName: string | null | undefined): string {
    if (fileName) {
        return `${chartName} — ${fileName}`;
    }
    return chartName;
}