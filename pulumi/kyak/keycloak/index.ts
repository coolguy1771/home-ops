import * as pulumi from "@pulumi/pulumi";
import * as keycloak from "@pulumi/keycloak";
import * as k8s from "@pulumi/kubernetes";

// Configure the Kubernetes provider
const k8sProvider = new k8s.Provider("k8s");
const config = new pulumi.Config();

const ldapSecret = k8s.core.v1.Secret.get("ldapAdminSecret", "auth/lldap-secret", { provider: k8sProvider });

// Decode the secret (assuming the value is base64 encoded)
const bindCredential = ldapSecret.data["LLDAP_LDAP_USER_PASS"].apply(password => {
    const decodedPassword = Buffer.from(password, "base64").toString("utf8");
    // Treat the decoded password as a Pulumi secret
    return pulumi.secret(decodedPassword);
});

// Create a Keycloak Realm
const realm = new keycloak.Realm("home", {
    realm: "home",
    enabled: true,
    accessCodeLifespan: "1m0s",
    accessCodeLifespanLogin: "30m0s",
    accessCodeLifespanUserAction: "5m0s",
    accessTokenLifespan: "1m0s",
    accessTokenLifespanForImplicitFlow: "15m0s",
    actionTokenGeneratedByAdminLifespan: "12h0m0s",
    actionTokenGeneratedByUserLifespan: "5m0s",
    browserFlow: "browser",
    clientAuthenticationFlow: "clients",
    clientSessionIdleTimeout: "0s",
    clientSessionMaxLifespan: "0s",
    defaultSignatureAlgorithm: "RS256",
    directGrantFlow: "direct grant",
    displayName: "Keycloak",
    displayNameHtml: "<div class=\"kc-logo-text\"><span>Keycloak</span></div>",
    dockerAuthenticationFlow: "docker auth",
    loginWithEmailAllowed: true,
    oauth2DeviceCodeLifespan: "10m0s",
    oauth2DevicePollingInterval: 5,
    offlineSessionIdleTimeout: "720h0m0s",
    offlineSessionMaxLifespan: "1440h0m0s",
    otpPolicy: {
        initialCounter: 0,
    },
    registrationFlow: "registration",
    resetCredentialsFlow: "reset credentials",
    smtpServer: {
        from: "keycloak@286k.co",
        fromDisplayName: "Keycloak",
        host: "smtp-relay.auth.svc.cluster.local",
    },
    ssoSessionIdleTimeout: "30m0s",
    ssoSessionIdleTimeoutRememberMe: "0s",
    ssoSessionMaxLifespan: "10h0m0s",
    ssoSessionMaxLifespanRememberMe: "0s",
    webAuthnPasswordlessPolicy: {
        signatureAlgorithms: ["ES256"],
    },
    webAuthnPolicy: {
        signatureAlgorithms: ["ES256"],
    },
});
const adminRealm = new keycloak.Realm("master", {
    realm: "master",
    enabled: true,
    accessCodeLifespan: "1m0s",
    accessCodeLifespanLogin: "30m0s",
    accessCodeLifespanUserAction: "5m0s",
    accessTokenLifespan: "1m0s",
    accessTokenLifespanForImplicitFlow: "15m0s",
    actionTokenGeneratedByAdminLifespan: "12h0m0s",
    actionTokenGeneratedByUserLifespan: "5m0s",
    browserFlow: "browser",
    clientAuthenticationFlow: "clients",
    clientSessionIdleTimeout: "0s",
    clientSessionMaxLifespan: "0s",
    defaultSignatureAlgorithm: "RS256",
    directGrantFlow: "direct grant",
    displayName: "Keycloak",
    displayNameHtml: "<div class=\"kc-logo-text\"><span>Keycloak</span></div>",
    dockerAuthenticationFlow: "docker auth",
    loginWithEmailAllowed: true,
    oauth2DeviceCodeLifespan: "10m0s",
    oauth2DevicePollingInterval: 5,
    offlineSessionIdleTimeout: "720h0m0s",
    offlineSessionMaxLifespan: "1440h0m0s",
    otpPolicy: {
        initialCounter: 0,
    },
    registrationFlow: "registration",
    resetCredentialsFlow: "reset credentials",
    smtpServer: {
        from: "keycloak@286k.co",
        fromDisplayName: "Keycloak",
        host: "smtp-relay.auth.svc.cluster.local",
    },
    ssoSessionIdleTimeout: "30m0s",
    ssoSessionIdleTimeoutRememberMe: "0s",
    ssoSessionMaxLifespan: "10h0m0s",
    ssoSessionMaxLifespanRememberMe: "0s",
    webAuthnPasswordlessPolicy: {
        signatureAlgorithms: ["ES256"],
    },
    webAuthnPolicy: {
        signatureAlgorithms: ["ES256"],
    },
});

const adminlldap = new keycloak.ldap.UserFederation("admin-lldap", {
    batchSizeForSync: 0,
    bindDn: "uid=admin,ou=people,dc=home,dc=arpa",
    bindCredential: bindCredential,
    changedSyncPeriod: 86400,
    connectionUrl: "ldap://lldap.auth.svc.cluster.local:389",
    fullSyncPeriod: 604800,
    name: "lldap",
    pagination: false,
    rdnLdapAttribute: "uid",
    realmId: adminRealm.id,
    syncRegistrations: true,
    usePasswordModifyExtendedOp: true,
    useTruststoreSpi: "ALWAYS",
    userObjectClasses: ["person"],
    usernameLdapAttribute: "uid",
    usersDn: "ou=people,dc=home,dc=arpa",
    uuidLdapAttribute: "uid",
});


// Create an LDAP User Federation provider
const lldap = new keycloak.ldap.UserFederation("lldap", {
    batchSizeForSync: 0,
    bindDn: "uid=admin,ou=people,dc=home,dc=arpa",
    bindCredential: bindCredential,
    changedSyncPeriod: 86400,
    connectionUrl: "ldap://lldap.auth.svc.cluster.local:389",
    fullSyncPeriod: 604800,
    name: "lldap",
    pagination: false,
    rdnLdapAttribute: "uid",
    realmId: realm.id,
    syncRegistrations: true,
    usePasswordModifyExtendedOp: true,
    useTruststoreSpi: "ALWAYS",
    userObjectClasses: ["person"],
    usernameLdapAttribute: "uid",
    usersDn: "ou=people,dc=home,dc=arpa",
    uuidLdapAttribute: "uid",
});

// Create a Group Mapper
const groupMapper = new keycloak.ldap.GroupMapper("lldap-group-mapper", {
    groupNameLdapAttribute: "cn",
    groupObjectClasses: ["groupOfUniqueNames"],
    groupsPath: "/",
    ldapGroupsDn: "ou=groups,dc=home,dc=arpa",
    ldapUserFederationId: lldap.id,
    membershipLdapAttribute: "member",
    membershipUserLdapAttribute: "uid",
    name: "groups",
    realmId: realm.id,
});

const adminGroupMapper = new keycloak.ldap.GroupMapper("admin-lldap-group-mapper", {
    groupNameLdapAttribute: "cn",
    groupObjectClasses: ["groupOfUniqueNames"],
    groupsPath: "/",
    ldapGroupsDn: "ou=groups,dc=home,dc=arpa",
    ldapUserFederationId: adminlldap.id,
    membershipLdapAttribute: "member",
    membershipUserLdapAttribute: "uid",
    name: "groups",
    realmId: adminRealm.id,
});

// Create a User Attribute Mapper for "first name"
const firstNameMapper = new keycloak.ldap.UserAttributeMapper("first-name-mapper", {
    name: "first name",
    realmId: realm.realm,
    ldapUserFederationId: lldap.id,
    userModelAttribute: "firstName",
    ldapAttribute: "givenname",
    readOnly: true,
});
const adminfirstNameMapper = new keycloak.ldap.UserAttributeMapper("admin-first-name-mapper", {
    name: "first name",
    realmId: realm.realm,
    ldapUserFederationId: adminlldap.id,
    userModelAttribute: "firstName",
    ldapAttribute: "givenname",
    readOnly: true,
});

const userGroup = new keycloak.Group("user", {
    name: "user",
    realmId: realm.id,
});
