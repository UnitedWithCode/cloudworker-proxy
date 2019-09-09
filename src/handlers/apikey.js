const KvStorage = require('../services/kvStorage');
const jwtRefresh = require('./jwt-refresh');

module.exports = function apikeyHandler({
    kvAccountId,
    kvNamespace,
    kvAuthEmail,
    kvAuthKey,
    oauth2AuthDomain,
    oauthClientId,
    oauth2ClientSecret,    
    kvTtl = 2592000, // A month
    kvPrefix = 'apikeys-',
}) {
    const kvStorage = new KvStorage({
        accountId: kvAccountId,
        namespace: kvNamespace,
        authEmail: kvAuthEmail,
        authKey: kvAuthKey,
        ttl: kvTtl,
    });

    const authDomain = oauth2AuthDomain;
    const clientId = oauthClientId;
    const clientSecret = oauth2ClientSecret;

    return async (ctx, next) => {
        const apiKeyHeader = ctx.request.headers['x-api-key'];

        if (!apiKeyHeader) {
            return next(ctx);
        }

        const [userHash, apiKey] = apiKeyHeader.split('.');

        const kvKey = kvPrefix + userHash;
        const apiKeys = JSON.parse(await kvStorage.get(kvKey) || '{}');
        
        if (apiKeys[apiKey]) {
            if (apiKeys[apiKey].expires < Date.now()) {
                apiKeys[apiKey] = await jwtRefresh({
                    refreshToken: apiKeys[apiKey].refreshToken,
                    authDomain,
                    clientId, 
                    clientSecret,
                });

                await kvStorage.put(kvKey, JSON.stringify(apiKeys));
            }

            ctx.request.headers.authorization = `bearer ${apiKeys[apiKey].accessToken}`;
        }

        return next(ctx);
    };
};
