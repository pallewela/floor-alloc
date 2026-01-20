// Microsoft Entra ID Authentication Module
// Uses MSAL.js (Microsoft Authentication Library) for browser-based authentication

class AuthManager {
    constructor() {
        this.msalInstance = null;
        this.account = null;
        this.initialized = false;
        this.initializationPromise = null;
    }

    /**
     * Build MSAL configuration from auth-config.js settings
     */
    getMsalConfig() {
        const redirectUri = authConfig.redirectUri || window.location.origin + window.location.pathname;
        
        return {
            auth: {
                clientId: authConfig.clientId,
                authority: `https://login.microsoftonline.com/${authConfig.tenantId}`,
                redirectUri: redirectUri,
                postLogoutRedirectUri: window.location.origin
            },
            cache: {
                cacheLocation: authConfig.cacheLocation || "sessionStorage",
                storeAuthStateInCookie: false
            },
            system: {
                loggerOptions: {
                    logLevel: msal.LogLevel.Warning,
                    loggerCallback: (level, message, containsPii) => {
                        if (containsPii) return;
                        switch (level) {
                            case msal.LogLevel.Error:
                                console.error('[MSAL]', message);
                                break;
                            case msal.LogLevel.Warning:
                                console.warn('[MSAL]', message);
                                break;
                            case msal.LogLevel.Info:
                                console.info('[MSAL]', message);
                                break;
                            case msal.LogLevel.Verbose:
                                console.debug('[MSAL]', message);
                                break;
                        }
                    }
                }
            }
        };
    }

    /**
     * Initialize MSAL and handle any redirect response
     */
    async initialize() {
        // Return existing promise if already initializing
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // Return immediately if already initialized
        if (this.initialized) {
            return;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            // Check if auth is configured
            if (!isAuthConfigured()) {
                console.warn('[Auth] Entra ID not configured. Using manual username input.');
                this.initialized = true;
                return;
            }

            // Check if MSAL is available
            if (typeof msal === 'undefined') {
                console.error('[Auth] MSAL library not loaded');
                this.initialized = true;
                return;
            }

            const msalConfig = this.getMsalConfig();
            this.msalInstance = new msal.PublicClientApplication(msalConfig);
            
            // Initialize MSAL
            await this.msalInstance.initialize();
            
            // Handle redirect response (if returning from login)
            const response = await this.msalInstance.handleRedirectPromise();
            
            if (response) {
                // User just logged in via redirect
                this.account = response.account;
                console.log('[Auth] Login successful via redirect');
            } else {
                // Check if user is already signed in (cached session)
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    console.log('[Auth] Found cached account');
                }
            }
            
            this.initialized = true;
            
        } catch (error) {
            console.error('[Auth] Initialization failed:', error);
            this.initialized = true;
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.account !== null;
    }

    /**
     * Check if authentication is configured
     */
    isConfigured() {
        return isAuthConfigured();
    }

    /**
     * Sign in the user (redirect-based flow)
     */
    async signIn() {
        if (!this.msalInstance) {
            await this.initialize();
        }

        if (!this.msalInstance || !this.isConfigured()) {
            console.warn('[Auth] Cannot sign in - auth not configured');
            return null;
        }

        try {
            // Try silent sign-in first (for cached tokens)
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                this.account = accounts[0];
                
                // Try to silently acquire a token to validate the session
                try {
                    await this.msalInstance.acquireTokenSilent({
                        scopes: authConfig.scopes,
                        account: this.account
                    });
                    return this.account;
                } catch (silentError) {
                    // Silent token acquisition failed, need interactive login
                    console.log('[Auth] Silent token failed, redirecting to login');
                }
            }

            // Redirect to Microsoft login page
            const loginRequest = {
                scopes: authConfig.scopes,
                prompt: "select_account"
            };
            
            await this.msalInstance.loginRedirect(loginRequest);
            // Note: This will redirect away from the page
            
        } catch (error) {
            console.error('[Auth] Sign in failed:', error);
            throw error;
        }
    }

    /**
     * Sign out the user
     */
    async signOut() {
        if (!this.msalInstance) {
            console.warn('[Auth] Cannot sign out - not initialized');
            return;
        }
        
        try {
            const logoutRequest = {
                account: this.account,
                postLogoutRedirectUri: window.location.origin
            };
            
            await this.msalInstance.logoutRedirect(logoutRequest);
            // Note: This will redirect away from the page
            
        } catch (error) {
            console.error('[Auth] Sign out failed:', error);
            // Clear local state anyway
            this.account = null;
        }
    }

    /**
     * Get the current user information
     */
    getUser() {
        if (!this.account) return null;
        
        return {
            name: this.account.name || this.account.username,
            email: this.account.username,
            id: this.account.localAccountId || this.account.homeAccountId
        };
    }

    /**
     * Get the user's display name
     */
    getUserDisplayName() {
        const user = this.getUser();
        return user ? user.name : null;
    }

    /**
     * Get the user's email
     */
    getUserEmail() {
        const user = this.getUser();
        return user ? user.email : null;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();
