import { useFileUpload } from './HandleFileUpload';

export function Home() {
    const handleUpload = useFileUpload();
    return (
        <div>
            <input
                type="file"
                accept=".json,application/json"
                onChange={handleUpload}
            />
        </div>
    );
}
