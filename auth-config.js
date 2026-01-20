// Microsoft Entra ID Authentication Configuration
// 
// To configure authentication:
// 1. Register your app in Azure Portal (Microsoft Entra ID → App registrations)
// 2. Set redirect URI type to "Single-page application (SPA)"
// 3. Add redirect URI: http://localhost:8000/booking.html (for development)
// 4. Copy your Application (client) ID and Directory (tenant) ID below

const authConfig = {
    // Application (client) ID from Azure Portal
    clientId: "YOUR_CLIENT_ID_HERE",
    
    // Directory (tenant) ID from Azure Portal
    // Use "common" for multi-tenant apps, or "consumers" for personal Microsoft accounts only
    tenantId: "YOUR_TENANT_ID_HERE",
    
    // Redirect URI - automatically detected from current location
    // Override this if you need a specific redirect URI
    redirectUri: null,
    
    // Scopes requested during authentication
    scopes: ["User.Read"],
    
    // Cache location: "sessionStorage" or "localStorage"
    cacheLocation: "sessionStorage"
};

// Check if configuration is complete
function isAuthConfigured() {
    return authConfig.clientId !== "YOUR_CLIENT_ID_HERE" && 
           authConfig.tenantId !== "YOUR_TENANT_ID_HERE";
}
