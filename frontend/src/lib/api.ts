
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function checkApiHealth(): Promise<{
    status: string;
    service: string;
}> {
    const response = await fetch(`${API_URL}/api/health`);

    if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
    }

    return response.json();
}
