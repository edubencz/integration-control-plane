// Nexdom management API helpers retained for custom MI features.
import ballerina/http;
import ballerina/log;
import ballerina/url;
import wso2/icp_server.storage;
import wso2/icp_server.types;

const string HEADER_AUTHORIZATION = "Authorization";
const string HEADER_ACCEPT = "Accept";
const string CONTENT_TYPE_JSON = "application/json";

public isolated function fetchApiArtifact(http:Client mgmtClient, string hmacToken, string apiName) returns types:MgmtRestApiInfo|error {
    string path = string `${MGMT_API_PATH}/apis?apiName=${apiName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtRestApiInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

// Fetch the OpenAPI document exposed by the API's own listener. Prefer the runtime's HTTPS
// endpoint on the standard external port (443), which is how MI APIs are commonly exposed
// behind an ingress. Fall back to the scheme and listener port advertised by the MI Management
// API for direct/local runtime deployments. Only the already-trusted runtime host is used.
public isolated function fetchApiSwagger(types:Runtime runtime, string componentId, string environmentId,
        types:MgmtRestApiInfo apiInfo, boolean allowInsecureTLS) returns string|error {
    if runtime.managementHostname is () {
        return error("Runtime hostname is not configured");
    }

    string runtimeHost = runtime.managementHostname ?: "";
    string preferredBaseUrl = string `https://${runtimeHost}`;
    string|error preferredDocument = fetchApiSwaggerFromBaseUrl(preferredBaseUrl, apiInfo.name,
            allowInsecureTLS);
    if preferredDocument is string {
        return preferredDocument;
    }

    log:printDebug("OpenAPI fetch via preferred HTTPS endpoint failed; trying MI-advertised listener",
            componentId = componentId, environmentId = environmentId, apiName = apiInfo.name,
            preferredBaseUrl = preferredBaseUrl, errorMessage = preferredDocument.message());

    string|error advertisedBaseUrl = buildAdvertisedApiBaseUrl(runtimeHost, apiInfo);
    if advertisedBaseUrl is error {
        return error(string `OpenAPI fetch failed via preferred endpoint '${preferredBaseUrl}': ${preferredDocument.message()}; unable to resolve MI-advertised listener: ${advertisedBaseUrl.message()}`);
    }
    if advertisedBaseUrl == preferredBaseUrl {
        return preferredDocument;
    }

    string|error advertisedDocument = fetchApiSwaggerFromBaseUrl(advertisedBaseUrl, apiInfo.name,
            allowInsecureTLS);
    if advertisedDocument is string {
        return advertisedDocument;
    }
    return error(string `OpenAPI fetch failed via preferred endpoint '${preferredBaseUrl}': ${preferredDocument.message()}; MI-advertised endpoint '${advertisedBaseUrl}': ${advertisedDocument.message()}`);
}

isolated function buildAdvertisedApiBaseUrl(string runtimeHost, types:MgmtRestApiInfo apiInfo)
        returns string|error {
    if apiInfo.url is () {
        return error(string `MI did not return a URL for API '${apiInfo.name}'`);
    }

    string apiUrl = apiInfo.url ?: "";
    int? schemeEnd = apiUrl.indexOf("://");
    if schemeEnd is () {
        return error(string `Invalid MI API URL: ${apiUrl}`);
    }
    string scheme = apiUrl.substring(0, schemeEnd).toLowerAscii();
    if scheme != "http" && scheme != "https" {
        return error(string `Unsupported MI API URL scheme '${scheme}'`);
    }
    int? pathStart = apiUrl.indexOf("/", schemeEnd + 3);
    if pathStart is () {
        return error(string `Invalid MI API URL (missing path): ${apiUrl}`);
    }
    string authority = apiUrl.substring(schemeEnd + 3, pathStart);
    int? portSeparator = authority.lastIndexOf(":");
    string portText = portSeparator is int ? authority.substring(portSeparator + 1) : "";
    // MI uses -1 when the management API cannot determine the listener port.
    // Treat that sentinel as absent and fall back to the port encoded in the
    // API URL (the same URL used by the runtime to expose the API).
    int listenerPort = portText == "" ? (scheme == "https" ? 443 : 80) : check int:fromString(portText);
    int? configuredPort = apiInfo.port;
    if configuredPort is int && configuredPort > 0 {
        listenerPort = configuredPort;
    }
    if listenerPort < 1 || listenerPort > 65535 {
        return error(string `Invalid MI API listener port: ${listenerPort}`);
    }

    return string `${scheme}://${runtimeHost}:${listenerPort.toString()}`;
}

isolated function fetchApiSwaggerFromBaseUrl(string baseUrl, string apiName, boolean allowInsecureTLS)
        returns string|error {
    http:Client|error clientResult = allowInsecureTLS
        ? new (baseUrl, {secureSocket: {enable: false}})
        : new (baseUrl);
    if clientResult is error {
        return error(string `Failed to create API listener client: ${clientResult.message()}`);
    }
    http:Response|error responseResult = clientResult->get(string `/${apiName}?swagger.json`, {
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    if responseResult is error {
        return error(string `OpenAPI fetch failed: ${responseResult.message()}`);
    }
    if responseResult.statusCode < 200 || responseResult.statusCode >= 300 {
        string|error body = responseResult.getTextPayload();
        return error(string `OpenAPI fetch returned status ${responseResult.statusCode}: ${body is string ? body : "Unknown error"}`);
    }
    string|error document = responseResult.getTextPayload();
    if document is error {
        return error(string `Failed to read OpenAPI document: ${document.message()}`);
    }
    return document;
}

public isolated function fetchProxyServiceArtifact(http:Client mgmtClient, string hmacToken, string proxyServiceName) returns types:MgmtProxyServiceInfo|error {
    string path = string `${MGMT_API_PATH}/proxy-services?proxyServiceName=${proxyServiceName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtProxyServiceInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

isolated function fetchEndpointArtifact(http:Client mgmtClient, string hmacToken, string endpointName) returns types:MgmtEndpointInfo|error {
    string path = string `${MGMT_API_PATH}/endpoints?endpointName=${endpointName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtEndpointInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

isolated function fetchSequenceArtifact(http:Client mgmtClient, string hmacToken, string sequenceName) returns types:MgmtSequenceInfo|error {
    string path = string `${MGMT_API_PATH}/sequences?sequenceName=${sequenceName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtSequenceInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

isolated function fetchTaskArtifact(http:Client mgmtClient, string hmacToken, string taskName) returns types:MgmtTaskInfo|error {
    string path = string `${MGMT_API_PATH}/tasks?taskName=${taskName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtTaskInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

public isolated function fetchLocalEntryArtifact(http:Client mgmtClient, string hmacToken, string entryName) returns types:MgmtLocalEntryInfo|error {
    string path = string `${MGMT_API_PATH}/local-entries?name=${entryName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtLocalEntryInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

public isolated function fetchMessageStoreArtifact(http:Client mgmtClient, string hmacToken, string storeName) returns types:MgmtMessageStoreInfo|error {
    string path = string `${MGMT_API_PATH}/message-stores?name=${storeName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtMessageStoreInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

public isolated function fetchMessageProcessorArtifact(http:Client mgmtClient, string hmacToken, string processorName) returns types:MgmtMessageProcessorInfo|error {
    string path = string `${MGMT_API_PATH}/message-processors?name=${processorName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtMessageProcessorInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

public isolated function fetchInboundEndpointArtifact(http:Client mgmtClient, string hmacToken, string inboundName) returns types:MgmtInboundEndpointInfo|error {
    string path = string `${MGMT_API_PATH}/inbound-endpoints?inboundEndpointName=${inboundName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtInboundEndpointInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

isolated function fetchConnectorArtifact(http:Client mgmtClient, string hmacToken, string connectorName, string? packageName) returns types:MgmtConnectorInfo|error {
    string path = string `${MGMT_API_PATH}/connectors`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtConnectorInfo[] result = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    foreach types:MgmtConnectorInfo connector in result {
        if connector.name == connectorName && (packageName is () || connector.'package == packageName) {
            return connector;
        }
    }
    return error(string `Connector '${connectorName}' not found in MI management API response`);
}

isolated function fetchTemplateArtifact(http:Client mgmtClient, string hmacToken, string templateName, string templateType) returns types:MgmtTemplateInfo|error {
    string path = string `${MGMT_API_PATH}/templates?name=${templateName}&type=${templateType}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtTemplateInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

public isolated function fetchDataServiceArtifact(http:Client mgmtClient, string hmacToken, string dataServiceName) returns types:MgmtDataServiceInfo|error {
    string path = string `${MGMT_API_PATH}/data-services?dataServiceName=${dataServiceName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtDataServiceInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

public isolated function fetchDataSourceArtifact(http:Client mgmtClient, string hmacToken, string dataSourceName) returns types:MgmtDataSourceInfo|error {
    string path = string `${MGMT_API_PATH}/data-sources?name=${dataSourceName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtDataSourceInfo result = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    log:printDebug("Data source converted to type",
            dataSourceName = dataSourceName,
            hasConfigParams = result.configurationParameters is map<json>,
            configParamsValue = result.configurationParameters);
    return result;
}

isolated function fetchCompositeAppArtifact(http:Client mgmtClient, string hmacToken, string compositeAppName) returns types:MgmtCompositeAppInfo|error {
    string path = string `${MGMT_API_PATH}/applications?carbonAppName=${compositeAppName}`;
    log:printDebug("Calling MI management API", path = path);
    types:MgmtCompositeAppInfo respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

// Fetch loggers from the MI Management API
public isolated function fetchLoggers(http:Client mgmtClient, string hmacToken) returns types:MgmtLoggersResponse|error {
    string path = string `${MGMT_API_PATH}/logging`;
    log:printDebug("Fetching loggers from MI management API");
    types:MgmtLoggersResponse respResult = check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
    return respResult;
}

// Update logger (add new logger, update log level, or update root logger)
public isolated function updateLogger(http:Client mgmtClient, string hmacToken, types:MgmtUpdateLoggerRequest request) returns types:MgmtUpdateLoggerResponse|error {
    string path = string `${MGMT_API_PATH}/logging`;
    log:printDebug("Calling MI management API to update logger", path = path, loggerName = request.loggerName, loggingLevel = request.loggingLevel);

    do {
        types:MgmtUpdateLoggerResponse respResult = check mgmtClient->patch(path, request, {
            [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
            [HEADER_ACCEPT]: CONTENT_TYPE_JSON
        });

        log:printInfo("Successfully updated logger via MI management API", loggerName = request.loggerName, loggingLevel = request.loggingLevel);
        return respResult;
    } on fail error e {
        log:printError("Failed to update logger via MI management API", loggerName = request.loggerName, errorMessage = e.message());
        return e;
    }
}

// Delete logger via the MI Management API
public isolated function deleteLogger(http:Client mgmtClient, string hmacToken, string loggerName) returns types:MgmtDeleteLoggerResponse|error {
    string encodedName = check url:encode(loggerName, "UTF-8");
    string path = string `${MGMT_API_PATH}/logging?loggerName=${encodedName}`;
    log:printDebug("Calling MI management API to delete logger", path = path, loggerName = loggerName);

    do {
        types:MgmtDeleteLoggerResponse respResult = check mgmtClient->delete(path, headers = {
            [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
            [HEADER_ACCEPT]: CONTENT_TYPE_JSON
        });

        log:printInfo("Successfully deleted logger via MI management API", loggerName = loggerName);
        return respResult;
    } on fail error e {
        log:printError("Failed to delete logger via MI management API", loggerName = loggerName, errorMessage = e.message());
        return e;
    }
}

// ============================================================
// Dispatcher function
// ============================================================

// Artifact types that have a 'configuration' field i.e. source
public type LegacyArtifactWithConfig types:MgmtRestApiInfo|types:MgmtProxyServiceInfo|types:MgmtEndpointInfo|
    types:MgmtSequenceInfo|types:MgmtTaskInfo|types:MgmtMessageStoreInfo|types:MgmtMessageProcessorInfo|
    types:MgmtInboundEndpointInfo|types:MgmtTemplateInfo|types:MgmtDataServiceInfo|types:MgmtDataSourceInfo;

// fetchRawArtifactItem dispatches to the appropriate artifact-specific fetch function
// based on the artifact type and returns the typed record.
isolated function getArtifactsWithSource(http:Client mgmtClient, string hmacToken, string artifactType, string artifactName, string? packageName = (), string? templateType = ()) returns LegacyArtifactWithConfig|error {
    // Dispatch to artifact-specific fetch functions and return typed records
    if artifactType == ARTIFACT_TYPE_API {
        return check fetchApiArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_PROXY_SERVICE {
        return check fetchProxyServiceArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_ENDPOINT {
        return check fetchEndpointArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_SEQUENCE {
        return check fetchSequenceArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_TASK {
        return check fetchTaskArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_MESSAGE_STORE {
        return check fetchMessageStoreArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_MESSAGE_PROCESSOR {
        return check fetchMessageProcessorArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_INBOUND_ENDPOINT {
        return check fetchInboundEndpointArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_TEMPLATE {
        if templateType is () {
            return error(string `Template artifact type requires 'templateType' parameter to be specified`);
        }
        return check fetchTemplateArtifact(mgmtClient, hmacToken, artifactName, templateType);
    } else if artifactType == ARTIFACT_TYPE_DATA_SERVICE {
        return check fetchDataServiceArtifact(mgmtClient, hmacToken, artifactName);
    } else if artifactType == ARTIFACT_TYPE_DATA_SOURCE {
        return check fetchDataSourceArtifact(mgmtClient, hmacToken, artifactName);
    } else {
        return error(string `Unsupported artifact type for MI management API: ${artifactType}`);
    }
}

// ============================================================
// Public API functions
// ============================================================

// fetchArtifactDetails returns the synapse configuration XML for the named
// artifact, or the full metadata JSON when no 'configuration' field is present.
public isolated function getArtifactSource(http:Client mgmtClient, string hmacToken, string artifactType, string artifactName, string? packageName = (), string? templateType = ()) returns string|error {
    log:printDebug("Fetching artifact details from MI management API",
            artifactType = artifactType, artifactName = artifactName);

    LegacyArtifactWithConfig artifact = check getArtifactsWithSource(mgmtClient, hmacToken, artifactType, artifactName, packageName, templateType);

    // Extract configuration field for artifacts that have it
    string? config = artifact.configuration;
    if config is string && config.length() > 0 {
        return config;
    }

    // Fallback: return full artifact metadata as JSON
    return artifact.toJson().toJsonString();
}

public isolated function flattenRegistrySearchNode(json node, string parentPath, string searchKey) returns types:RegistrySearchItem[] {
    types:RegistrySearchItem[] results = [];
    if node !is map<json> {
        return results;
    }

    json? nameValue = node["name"];
    string name = nameValue is string ? nameValue : "";
    json? typeValue = node["type"];
    string nodeType = typeValue is string ? typeValue : "";
    json? mediaTypeValue = node["mediaType"];
    string mediaType = mediaTypeValue is string ? mediaTypeValue : nodeType;
    // MI also returns an empty `files` array for leaf resources. The resource type, not the
    // presence of that array, determines whether this node represents a directory.
    boolean isDirectory = nodeType == "directory" || mediaType == "directory";
    string currentPath = name == "" ? parentPath : parentPath == "" ? name : string `${parentPath}/${name}`;

    if name != "" && name.toLowerAscii().includes(searchKey.toLowerAscii()) {
        results.push({
            name: name,
            path: currentPath,
            mediaType: isDirectory ? "directory" : mediaType,
            isDirectory: isDirectory
        });
    }

    json? children = node["files"];
    if children is json[] {
        foreach json child in children {
            results.push(...flattenRegistrySearchNode(child, currentPath, searchKey));
        }
    }
    return results;
}

// Search registry resources recursively below a registry path.
// The MI endpoint returns a nested tree for searchKey; flatten it for GraphQL consumers.
public isolated function fetchRegistryResourceSearch(http:Client mgmtClient, string hmacToken, string path, string searchKey) returns types:RegistrySearchResponse|error {
    string encodedPath = check url:encode(path, "UTF-8");
    string encodedSearchKey = check url:encode(searchKey, "UTF-8");
    string apiPath = string `${MGMT_API_PATH}/registry-resources?path=${encodedPath}&searchKey=${encodedSearchKey}`;
    log:printDebug("Calling MI management API", path = apiPath);
    json respJson = check mgmtClient->get(apiPath, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });

    types:RegistrySearchItem[] items = [];
    if respJson is map<json> {
        json? listValue = respJson["list"];
        int slashIndex = path.lastIndexOf("/") ?: -1;
        string parentPath = slashIndex >= 0 ? path.substring(0, slashIndex) : "";
        if listValue is map<json> {
            items = flattenRegistrySearchNode(listValue, parentPath, searchKey);
        } else if listValue is json[] {
            foreach json item in listValue {
                items.push(...flattenRegistrySearchNode(item, path, searchKey));
            }
        }
    }
    return {count: items.length(), items: items};
}

// Fetch the fault stack trace for a faulty Composite App from the MI management API
// GET /management/applications/{appName}/fault
public isolated function fetchCompositeAppFaultDiagnostic(http:Client mgmtClient, string hmacToken, string appName) returns MgmtCompositeAppFaultResponse|error {
    string encodedAppName = check url:encode(appName, "UTF-8");
    string path = string `${MGMT_API_PATH}/applications/${encodedAppName}/fault`;
    log:printDebug("Calling MI management API for Composite App fault diagnostic", path = path);
    return check mgmtClient->get(path, {
        [HEADER_AUTHORIZATION]: string `Bearer ${hmacToken}`,
        [HEADER_ACCEPT]: CONTENT_TYPE_JSON
    });
}

public isolated function createRegistryManagementClient(types:Runtime runtime, string runtimeId, boolean allowInsecureTLS) returns types:RegistryApiClient|error {
    log:printDebug("Creating registry management client", runtimeId = runtimeId, hostname = runtime.managementHostname, port = runtime.managementPort);

    string baseUrl = check storage:buildManagementBaseUrl(runtime.managementHostname, runtime.managementPort);
    http:Client mgmtClient = check (allowInsecureTLS
        ? new (baseUrl, {secureSocket: {enable: false}})
        : new (baseUrl));

    string hmacToken = check storage:issueRuntimeHmacToken(runtimeId);

    log:printDebug("Registry management client created", runtimeId = runtimeId, baseUrl = baseUrl);
    return {mgmtClient, hmacToken};
}
