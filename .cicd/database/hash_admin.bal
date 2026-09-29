import ballerina/crypto;
import ballerina/io;
import ballerina/os;

public function main() returns error? {
    string password = os:getEnv("ICP_ADMIN_PASSWORD");
    string outputFile = os:getEnv("ADMIN_HASH_FILE");
    if password.length() < 12 {
        return error("ICP_ADMIN_PASSWORD must contain at least 12 characters");
    }
    string hash = check crypto:hashBcrypt(password);
    check io:fileWriteString(outputFile, hash);
}
